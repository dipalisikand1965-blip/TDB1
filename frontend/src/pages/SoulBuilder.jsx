/**
 * SoulBuilder.jsx
 * 
 * THE MAGICAL SOUL BUILDER
 * A luxury onboarding experience for The Doggy Company
 * 
 * Design Inspired by: Luminaire Club Dream Weaver + Mira Demo
 * Colors: Dark purple/violet theme with pink accents
 * 
 * FEATURES:
 * - One question per screen (iOS golden principles)
 * - Real-time Soul Score with animated rings
 * - Personalized with [Pet Name] throughout
 * - Premium teasing after each answer
 * - 8 chapters, 51 questions
 * - Mobile-first, desktop enhanced
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, X, Camera, Sparkles, 
  Heart, Paw, Check, Moon, Sun, Zap, Shield,
  Home, Plane, Utensils, GraduationCap, Star, PawPrint
} from 'lucide-react';
import { API_URL } from '../utils/api';
import BreedAutocomplete from '../components/BreedAutocomplete';
import WelcomeWrappedModal from '../components/wrapped/WelcomeWrappedModal';

// ═══════════════════════════════════════════════════════════════════════════════
// SOUL BUILDER QUESTIONS - Following Soul Score Doctrine (8 Golden Pillars)
// TOTAL SCORING WEIGHT: 100 points (26 canonical fields)
// Non-scoring fields: captured for Mira context but DON'T affect score
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SOUL SCORE DOCTRINE (from /app/memory/CANONICAL_ANSWER_SYSTEM.md):
 * - 26 canonical scoring fields = 100 total points
 * - Non-scoring fields are saved but don't affect score
 * - Score = (earned_points / 100) * 100
 * 
 * SCORING fields are marked with `scoring: true`
 * NON-SCORING fields are marked with `scoring: false` (Mira uses these for context)
 */

const CHAPTERS = [
  {
    id: 'identity',
    title: 'Identity & Temperament',
    emoji: '🎭',
    description: "Who they are at their core",
    color: '#8B5CF6',
    // Pillar 1: 15 points total (per doctrine)
    questions: [
      // SCORING: temperament = 8 points (maps from general_nature OR describe_3_words)
      { id: 'general_nature', question: "{pet} is generally...", type: 'select', options: ['Calm', 'Curious', 'Playful', 'Shy', 'Guarded', 'Fearful', 'Highly energetic'], weight: 8, scoring: true, canonicalField: 'temperament' },
      // SCORING: life_stage = 5 points
      { id: 'life_stage', question: "What life stage is {pet} in?", type: 'select', options: ['Puppy (0-1 year)', 'Young adult (1-3 years)', 'Adult (3-7 years)', 'Senior (7+ years)'], weight: 5, scoring: true, canonicalField: 'life_stage' },
      // SCORING: noise_sensitivity = 4 points
      { id: 'loud_sounds', question: "How does {pet} react to loud sounds?", type: 'select', options: ['Completely fine', 'Mildly anxious', 'Very anxious', 'Needs comfort'], weight: 4, scoring: true, canonicalField: 'noise_sensitivity' },
      // SCORING: social_with_people = 4 points
      { id: 'stranger_reaction', question: "How does {pet} usually react to strangers?", type: 'select', options: ['Friendly', 'Cautious', 'Indifferent', 'Nervous', 'Protective'], weight: 4, scoring: true, canonicalField: 'social_with_people' },
      // NON-SCORING: describe_3_words (Mira context only)
      { id: 'describe_3_words', question: "What are three words that describe {pet} best?", type: 'text', weight: 0, scoring: false },
      // NON-SCORING: social_preference (Mira context only)
      { id: 'social_preference', question: "{pet} prefers...", type: 'select', options: ['Being around people', 'Being around other dogs', 'Being mostly with you', 'Being mostly independent'], weight: 0, scoring: false }
    ],
    confirmation: "Got it. I'll use this to guide how we approach people, handling, and new situations."
  },
  {
    id: 'family',
    title: 'Family & Pack',
    emoji: '👨‍👩‍👧‍👦',
    description: "Their social world",
    color: '#EC4899',
    // Pillar 2: 9 points total (doctrine: other_pets=2, kids_at_home=1, social_with_dogs=4, primary_bond=2)
    questions: [
      // SCORING: social_with_dogs = 4 points
      { id: 'behavior_with_dogs', question: "How does {pet} behave with other dogs?", type: 'select', options: ['Loves all dogs', 'Selective friends', 'Nervous', 'Reactive'], weight: 4, scoring: true, canonicalField: 'social_with_dogs' },
      // SCORING: other_pets = 2 points
      { id: 'other_pets', question: "Do you have other pets at home?", type: 'select', options: ['Yes, other dogs', 'Yes, cats', 'Yes, other animals', 'Multiple pets', 'No other pets'], weight: 2, scoring: true, canonicalField: 'other_pets' },
      // SCORING: primary_bond = 2 points
      { id: 'most_attached_to', question: "Who is {pet} most attached to?", type: 'select', options: ['Me', 'Partner', 'Children', 'Everyone equally'], weight: 2, scoring: true, canonicalField: 'primary_bond' },
      // SCORING: kids_at_home = 1 point
      { id: 'kids_at_home', question: "Are there children in your household?", type: 'select', options: ['Yes, young (0-5)', 'Yes, older (6-12)', 'Yes, teenagers', 'No children'], weight: 1, scoring: true, canonicalField: 'kids_at_home' },
      // NON-SCORING: lives_with (Mira context)
      { id: 'lives_with', question: "{pet} lives with...", type: 'multi_select', options: ['Adults only', 'Children', 'Other dogs', 'Other pets (cats, birds, etc.)'], weight: 0, scoring: false },
      // NON-SCORING: attention_seeking (Mira context)
      { id: 'attention_seeking', question: "Does {pet} like being the centre of attention?", type: 'select', options: ['Yes', 'Sometimes', 'No'], weight: 0, scoring: false }
    ],
    confirmation: "Perfect. This helps us choose the right social settings and care arrangements."
  },
  {
    id: 'rhythm',
    title: 'Rhythm & Routine',
    emoji: '⏰',
    description: "Their daily patterns",
    color: '#F59E0B',
    // Pillar 3: 11 points total (doctrine: alone_time_comfort=5, exercise_needs=2, feeding_times=2, morning_routine=2)
    questions: [
      // SCORING: alone_time_comfort = 5 points (maps from separation_anxiety OR alone_comfort)
      { id: 'separation_anxiety', question: "Does {pet} have separation anxiety?", type: 'select', options: ['No', 'Mild', 'Moderate', 'Severe'], weight: 5, scoring: true, canonicalField: 'alone_time_comfort' },
      // SCORING: exercise_needs = 2 points
      { id: 'exercise_needs', question: "How much daily exercise does {pet} need?", type: 'select', options: ['Light (15-30 mins)', 'Moderate (30-60 mins)', 'Active (1-2 hours)', 'Very active (2+ hours)'], weight: 2, scoring: true, canonicalField: 'exercise_needs' },
      // SCORING: feeding_times = 2 points
      { id: 'feeding_times', question: "When do you typically feed {pet}?", type: 'select', options: ['Once a day', 'Twice a day', 'Three times a day', 'Free feeding (grazing)'], weight: 2, scoring: true, canonicalField: 'feeding_times' },
      // SCORING: morning_routine = 2 points
      { id: 'morning_routine', question: "What does {pet}'s morning typically look like?", type: 'select', options: ['Early riser, ready to go', 'Slow starter, needs time', 'Excited for breakfast first', 'Morning walk is priority'], weight: 2, scoring: true, canonicalField: 'morning_routine' },
      // NON-SCORING: walks_per_day (Mira context)
      { id: 'walks_per_day', question: "How many walks does {pet} need per day?", type: 'select', options: ['1', '2', '3+'], weight: 0, scoring: false },
      // NON-SCORING: energetic_time (Mira context)
      { id: 'energetic_time', question: "What time of day is {pet} most energetic?", type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Night'], weight: 0, scoring: false },
      // NON-SCORING: sleep_location (Mira context)
      { id: 'sleep_location', question: "Where does {pet} usually sleep?", type: 'select', options: ['Your bed', 'Their own bed', 'Crate', 'Sofa or floor'], weight: 0, scoring: false }
    ],
    confirmation: "Noted. This becomes your default schedule for walks, grooming slots, and services."
  },
  {
    id: 'home',
    title: 'Home Comforts',
    emoji: '🏠',
    description: "Where they feel safe",
    color: '#10B981',
    // Pillar 4: 6 points total (doctrine: car_comfort=4, favorite_spot=2)
    questions: [
      // SCORING: car_comfort = 4 points
      { id: 'car_rides', question: "Does {pet} like car rides?", type: 'select', options: ['Loves them', 'Neutral', 'Anxious', 'Gets motion sickness'], weight: 4, scoring: true, canonicalField: 'car_comfort' },
      // SCORING: favorite_spot = 2 points
      { id: 'favorite_spot', question: "Where is {pet}'s favourite spot at home?", type: 'select', options: ['Couch/sofa', 'Their own bed', 'Sunny window', 'Near family members', 'Under furniture', 'Outdoors/garden'], weight: 2, scoring: true, canonicalField: 'favorite_spot' },
      // NON-SCORING: favorite_item (Mira context)
      { id: 'favorite_item', question: "Does {pet} have a favourite item?", type: 'select', options: ['Toy', 'Blanket', 'Bed', 'None'], weight: 0, scoring: false },
      // NON-SCORING: space_preference (Mira context)
      { id: 'space_preference', question: "{pet} prefers...", type: 'select', options: ['Quiet spaces', 'Busy spaces', 'Outdoor time', 'Indoor time'], weight: 0, scoring: false },
      // NON-SCORING: crate_trained (Mira context)
      { id: 'crate_trained', question: "Is {pet} crate-trained?", type: 'select', options: ['Yes', 'No', 'In training'], weight: 0, scoring: false }
    ],
    confirmation: "Great. This helps us pick the right environment—home visits vs busy places, and travel style."
  },
  {
    id: 'travel',
    title: 'Travel Style',
    emoji: '✈️',
    description: "Adventures together",
    color: '#3B82F6',
    // Pillar 5: 3 points total (doctrine: travel_readiness=3)
    questions: [
      // SCORING: travel_readiness = 3 points
      { id: 'usual_travel', question: "How does {pet} usually travel?", type: 'select', options: ['Car', 'Train', 'Flight (occasionally)', 'Never travels'], weight: 3, scoring: true, canonicalField: 'travel_readiness' },
      // NON-SCORING: hotel_experience (Mira context)
      { id: 'hotel_experience', question: "Has {pet} stayed in a hotel before?", type: 'select', options: ['Yes, loved it', 'Yes, but was anxious', 'No'], weight: 0, scoring: false },
      // NON-SCORING: stay_preference (Mira context)
      { id: 'stay_preference', question: "What kind of stay suits {pet} best?", type: 'select', options: ['Quiet nature hotel', 'Pet-friendly resort', 'City hotel', 'Homestay/villa'], weight: 0, scoring: false },
      // NON-SCORING: travel_social (Mira context)
      { id: 'travel_social', question: "During stays, {pet} prefers...", type: 'select', options: ['Private spaces', 'Social pet areas'], weight: 0, scoring: false }
    ],
    confirmation: "Perfect. This shapes travel picks and the kind of properties we suggest."
  },
  {
    id: 'taste',
    title: 'Taste & Treat',
    emoji: '🍖',
    description: "What they love to eat",
    color: '#EF4444',
    // Pillar 6: 19 points total (doctrine: food_allergies=10, food_motivation=3, favorite_protein=3, treat_preference=3)
    questions: [
      // SCORING: food_allergies = 10 points (HIGHEST - SAFETY CRITICAL)
      { id: 'food_allergies', question: "Does {pet} have any food allergies?", type: 'multi_select', options: ['None', 'Chicken', 'Beef', 'Grains', 'Dairy', 'Fish', 'Lamb', 'Other'], weight: 10, scoring: true, canonicalField: 'food_allergies' },
      // SCORING: food_motivation = 3 points
      { id: 'food_motivation', question: "How food-motivated is {pet}?", type: 'select', options: ['Very - will do anything for food', 'Moderately food motivated', 'Somewhat interested', 'Not very food motivated'], weight: 3, scoring: true, canonicalField: 'food_motivation' },
      // SCORING: favorite_protein = 3 points
      { id: 'favorite_protein', question: "What is {pet}'s favourite protein?", type: 'select', options: ['Chicken', 'Beef', 'Lamb', 'Fish', 'Pork', 'Vegetarian/Plant-based', 'No preference'], weight: 3, scoring: true, canonicalField: 'favorite_protein' },
      // SCORING: treat_preference = 3 points
      { id: 'treat_preference', question: "What type of treats does {pet} prefer?", type: 'multi_select', options: ['Soft/chewy', 'Crunchy', 'Freeze-dried', 'Fresh meat', 'Dental chews', 'Fruits/vegetables'], weight: 3, scoring: true, canonicalField: 'treat_preference' },
      // NON-SCORING: diet_type (Mira context)
      { id: 'diet_type', question: "What type of diet is {pet} on?", type: 'multi_select', options: ['Kibble/dry food', 'Wet food', 'Raw diet', 'Home-cooked', 'Mixed (dry + wet)', 'Grain-free', 'Prescription diet'], weight: 0, scoring: false },
      { id: 'fears', question: "Does {pet} have any fears?", type: 'multi_select', options: ['No known fears', 'Loud noises (fireworks, thunder)', 'Strangers', 'Other dogs', 'Being alone', 'Vehicles', 'Vet visits'], weight: 3, scoring: true },
      // NON-SCORING: sensitive_stomach (Mira context)
      { id: 'sensitive_stomach', question: "Does {pet} have a sensitive stomach?", type: 'select', options: ['Yes', 'No', 'Sometimes'], weight: 0, scoring: false }
    ],
    confirmation: "Noted. We'll use this for safe picks and better food recommendations."
  },
  {
    id: 'training',
    title: 'Training & Behaviour',
    emoji: '🎓',
    description: "How they learn",
    color: '#6366F1',
    // Pillar 7: 11 points total (doctrine: energy_level=6, behavior_issues=3, training_level=3, motivation_type=2) - Note: energy_level was moved here
    questions: [
      // SCORING: energy_level = 6 points
      { id: 'energy_level', question: "What is {pet}'s energy level?", type: 'select', options: ['Very high - always on the go', 'High - needs lots of activity', 'Moderate - balanced', 'Low - couch potato', 'Very low - senior pace'], weight: 6, scoring: true, canonicalField: 'energy_level' },
      // SCORING: behavior_issues = 3 points
      { id: 'behavior_issues', question: "Does {pet} have any behavioural issues?", type: 'multi_select', options: ['None', 'Excessive barking', 'Jumping', 'Pulling leash', 'Resource guarding', 'Aggression', 'Fear-based issues', 'Destructive behaviour'], weight: 3, scoring: true, canonicalField: 'behavior_issues' },
      // SCORING: training_level = 3 points
      { id: 'training_level', question: "Is {pet} trained?", type: 'select', options: ['Fully trained', 'Partially trained', 'Not trained'], weight: 3, scoring: true, canonicalField: 'training_level' },
      // SCORING: motivation_type = 2 points
      { id: 'motivation_type', question: "What motivates {pet} during training?", type: 'select', options: ['Treats/food', 'Praise and attention', 'Toys/play', 'A mix of everything'], weight: 2, scoring: true, canonicalField: 'motivation_type' },
      // NON-SCORING: leash_behavior (Mira context)
      { id: 'leash_behavior', question: "Does {pet} pull on the leash?", type: 'select', options: ['Always', 'Sometimes', 'Rarely'], weight: 0, scoring: false },
      // NON-SCORING: barking (Mira context)
      { id: 'barking', question: "Does {pet} bark often?", type: 'select', options: ['Yes', 'Occasionally', 'Rarely'], weight: 0, scoring: false }
    ],
    confirmation: "Got it. This helps us match the right trainers and routines."
  },
  {
    id: 'horizon',
    title: 'Long Horizon',
    emoji: '🌅',
    description: "Health & future care",
    color: '#F472B6',
    // Pillar 8: 17 points total (doctrine: health_conditions=8, vet_comfort=5, grooming_tolerance=4)
    questions: [
      // SCORING: health_conditions = 8 points (CRITICAL - SAFETY)
      { id: 'health_conditions', question: "Does {pet} have any health conditions?", type: 'multi_select', options: ['None', 'Arthritis', 'Diabetes', 'Heart condition', 'Skin allergies', 'Hip dysplasia', 'Eye problems', 'Epilepsy', 'Other chronic condition'], weight: 8, scoring: true, canonicalField: 'health_conditions' },
      // SCORING: vet_comfort = 5 points
      { id: 'vet_comfort', question: "How comfortable is {pet} at the vet?", type: 'select', options: ['Very comfortable', 'Slightly nervous', 'Anxious - needs extra handling', 'Very stressed - requires sedation'], weight: 5, scoring: true, canonicalField: 'vet_comfort' },
      // SCORING: grooming_tolerance = 4 points
      { id: 'grooming_tolerance', question: "How does {pet} handle grooming?", type: 'select', options: ['Loves it', 'Tolerates well', 'Gets anxious', 'Very difficult'], weight: 4, scoring: true, canonicalField: 'grooming_tolerance' },
      // NON-SCORING: vaccination_status (Mira context - important but separate tracking)
      { id: 'vaccination_status', question: "Is {pet} up to date on vaccinations?", type: 'select', options: ['Yes, fully vaccinated', 'Partially vaccinated', 'Overdue', 'Not sure'], weight: 0, scoring: false },
      // NON-SCORING: spayed_neutered (Mira context)
      { id: 'spayed_neutered', question: "Is {pet} spayed/neutered?", type: 'select', options: ['Yes', 'No', 'Planning to', 'Not applicable'], weight: 0, scoring: false },
      // NON-SCORING: medications (Mira context)
      { id: 'medications', question: "Is {pet} currently on any medications?", type: 'select', options: ['No medications', 'Yes, daily medication', 'Yes, occasional medication', 'Yes, supplements only'], weight: 0, scoring: false },
      // NON-SCORING: main_wish (Mira context)
      { id: 'main_wish', question: "What do you want most for {pet}?", type: 'multi_select', options: ['Good health', 'More training', 'More travel experiences', 'More social time with other dogs'], weight: 0, scoring: false },
      // NON-SCORING: celebration_preferences (Mira context)
      { id: 'celebration_preferences', question: "Which celebrations would you like to celebrate?", type: 'multi_select', options: ['Birthday', 'Gotcha Day', 'Diwali', 'Holi', 'Christmas', 'New Year', "Valentine's Day", 'Raksha Bandhan'], weight: 0, scoring: false },
      // SCORING: life_vision = 8 points — the guiding north star for Mira
      { id: 'life_vision', question: "In one sentence, what kind of life do you want for {pet}?", type: 'text', placeholder: 'e.g. A life full of adventure, love and salmon treats...', weight: 8, scoring: true, canonicalField: 'life_vision' }
    ],
    confirmation: "Beautiful. Everything Mira does for {pet} will be guided by this."
  }
];

// Calculate totals - ONLY scoring questions count towards soul score
const TOTAL_QUESTIONS = CHAPTERS.reduce((acc, ch) => acc + ch.questions.length, 0);
const SCORING_QUESTIONS = CHAPTERS.reduce((acc, ch) => 
  acc + ch.questions.filter(q => q.scoring).length, 0);
const TOTAL_WEIGHT = CHAPTERS.reduce((acc, ch) => 
  acc + ch.questions.reduce((qacc, q) => qacc + (q.scoring ? q.weight : 0), 0), 0);

// Verify doctrine compliance
console.log('[SoulBuilder] Total Questions:', TOTAL_QUESTIONS);
console.log('[SoulBuilder] Scoring Questions:', SCORING_QUESTIONS, '(doctrine: 26)');
console.log('[SoulBuilder] Total Weight:', TOTAL_WEIGHT, '(doctrine: 100)');

// Soul Score Tiers - Premium naming (Curious, Emerging, Attuned, In Bloom, Soulbound)
const SOUL_TIERS = [
  { min: 0, max: 24, name: 'Curious', color: '#A78BFA' },
  { min: 25, max: 49, name: 'Emerging', color: '#8B5CF6' },
  { min: 50, max: 74, name: 'Attuned', color: '#EC4899' },
  { min: 75, max: 89, name: 'In Bloom', color: '#F472B6' },
  { min: 90, max: 100, name: 'Soulbound', color: '#F9A8D4' }
];

const getTier = (score) => {
  return SOUL_TIERS.find(t => score >= t.min && score <= t.max) || SOUL_TIERS[0];
};

// Suggestion chips for "three words" question - per user feedback
const THREE_WORDS_SUGGESTIONS = [
  'Gentle', 'Curious', 'Playful', 'Calm', 'Alert', 'Sensitive'
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const SoulBuilder = () => {
  const navigate = useNavigate();
  
  // DEBUG: Log that component mounted
  console.log('[SoulBuilder] Component mounted');
  
  // Loading state - wait for pets to load
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  
  // State
  // Screens: preboarding, pet-hook, basic-info, chapter-intro, question, chapter-complete, 
  //          know_mira_summary (COMPULSORY checkpoint), know_more_start, final
  const [screen, setScreen] = useState('preboarding');
  const [petName, setPetName] = useState('');
  const [petPhoto, setPetPhoto] = useState(null);
  const [petPhotoPreview, setPetPhotoPreview] = useState(null);
  const [detectedBreed, setDetectedBreed] = useState('');
  const [petData, setPetData] = useState({
    breed: '',
    gender: '',
    birth_date: '',
    gotcha_date: '',
    is_neutered: null,
    approximate_age: '',
    weight: '',
    weight_unit: 'kg'
  });
  
  const [currentChapter, setCurrentChapter] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multiSelectValues, setMultiSelectValues] = useState([]);
  const [textInputValue, setTextInputValue] = useState('');
  const [miraKnows, setMiraKnows] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track questions already answered (from DB) - NEVER repeat these
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState(new Set());
  
  // Current pet ID (for canonical updates)
  const [currentPetId, setCurrentPetId] = useState(null);
  
  // Current working pet object (for displaying correct score)
  const [currentPet, setCurrentPet] = useState(null);
  
  // Welcome Wrapped Modal - shows after first Soul Profile completion
  const [showWelcomeWrapped, setShowWelcomeWrapped] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  // Multi-pet support
  const [existingPets, setExistingPets] = useState([]);
  
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const token = localStorage.getItem('tdb_auth_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
        if (!token) {
          setIsLoadingPets(false);
          return;
        }
        
        // Check for URL params (pet ID and continue flag from "Keep Teaching Mira")
        const urlParams = new URLSearchParams(window.location.search);
        const targetPetId = urlParams.get('pet');
        const shouldContinue = urlParams.get('continue') === 'true';
        
        const resp = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          const pets = Array.isArray(data) ? data : data.pets || [];
          setExistingPets(pets);
          
          // If user just signed up and has a pet, auto-load that pet's data
          // This handles the case where they come from onboarding
          if (pets.length >= 1) {
            // If specific pet ID passed in URL, use that; otherwise use first pet
            let pet = pets[0];
            if (targetPetId) {
              const foundPet = pets.find(p => p.id === targetPetId || p._id === targetPetId);
              if (foundPet) {
                pet = foundPet;
                console.log('[SoulBuilder] Using pet from URL param:', pet.name);
              }
            }
            console.log('[SoulBuilder] Auto-loading pet from onboarding:', pet.name);
            
            // Store pet ID for canonical updates
            setCurrentPetId(pet.id || pet._id);
            
            // Store the full pet object for displaying correct score
            setCurrentPet(pet);
            
            // Pre-fill pet info
            setPetName(pet.name || '');
            setPetPhotoPreview(pet.photo || null);
            setDetectedBreed(pet.breed || '');
            setPetData({
              breed: pet.breed || '',
              gender: pet.gender || '',
              birth_date: pet.birth_date || '',
              gotcha_date: pet.gotcha_date || '',
              is_neutered: pet.is_neutered,
              approximate_age: ''
            });
            
            // CRITICAL: Track ALL answered question IDs to prevent repetition
            // This is the canonical source - questions are UNIQUE across sessions
            const existingAnswers = pet.doggy_soul_answers || pet.soul_answers || {};
            const prefilledAnswers = {};
            const alreadyAnsweredIds = new Set();
            
            // Map ALL 13 onboarding question IDs to Soul Builder question IDs
            const fieldMapping = {
              'life_stage': 'life_stage',
              'stranger_reaction': 'stranger_reaction',
              'food_allergies': 'food_allergies',
              'health_conditions': 'health_conditions',
              'exercise_needs': 'exercise_needs',
              'grooming_tolerance': 'grooming_tolerance',
              'separation_anxiety': 'separation_anxiety',
              'lives_with': 'lives_with',
              'other_pets': 'other_pets',
              'is_neutered': 'spayed_neutered',
              'main_goal': 'main_wish',
              'temperament': 'general_nature',
              'favorite_protein': 'favorite_protein'
            };
            
            Object.keys(existingAnswers).forEach(key => {
              const value = existingAnswers[key];
              if (value && value !== 'None' && value !== '' && 
                  !(Array.isArray(value) && value.length === 0) &&
                  !(typeof value === 'object' && value.skipped)) {
                const mappedKey = fieldMapping[key] || key;
                
                // Track this question as answered (never repeat)
                alreadyAnsweredIds.add(mappedKey);
                alreadyAnsweredIds.add(key); // Also track original key
                
                // Format for Soul Builder
                if (['food_allergies', 'health_conditions', 'lives_with', 'main_goal', 'main_wish'].includes(key)) {
                  prefilledAnswers[mappedKey] = Array.isArray(value) ? value : [value];
                } else {
                  prefilledAnswers[mappedKey] = value;
                }
              }
            });
            
            // Set answered question IDs to prevent repetition
            setAnsweredQuestionIds(alreadyAnsweredIds);
            
            if (Object.keys(prefilledAnswers).length > 0) {
              setAnswers(prefilledAnswers);
              console.log('[SoulBuilder] Pre-filled answers from onboarding:', Object.keys(prefilledAnswers).length, 'questions');
              console.log('[SoulBuilder] Questions already answered (will not repeat):', [...alreadyAnsweredIds]);
            }
            
            // If continue=true from URL, go directly to KNOW_MORE_START
            // Otherwise show preboarding (which shows KNOW_MIRA_SUMMARY for returning users)
            if (shouldContinue) {
              console.log('[SoulBuilder] continue=true, going to know_more_start');
              setScreen('know_more_start');
            }
            // The preboarding screen will detect existing pet and show the summary
          }
        }
      } catch (e) { 
        console.error('[SoulBuilder] Error fetching pets:', e);
      } finally {
        setIsLoadingPets(false);
      }
    };
    fetchPets();
  }, []);
  
  // Basic Info screen state
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [breedSearch, setBreedSearch] = useState('');
  const [otherBreedSelected, setOtherBreedSelected] = useState(false);
  const [birthdayMode, setBirthdayMode] = useState('date');
  const [dateType, setDateType] = useState('birthday'); // 'birthday' | 'gotcha' | 'both'
  
  // Track if user has answered at least one question (for showing score vs badge)
  const hasAnsweredAny = Object.keys(answers).length > 0;
  
  const fileInputRef = useRef(null);
  
  // Calculate soul score based on answered questions
  // Calculate Soul Score - ONLY scoring questions count (doctrine: 100 total points)
  const calculateSoulScore = useCallback(() => {
    let earnedWeight = 0;
    Object.keys(answers).forEach(questionId => {
      CHAPTERS.forEach(chapter => {
        const question = chapter.questions.find(q => q.id === questionId);
        // ONLY count if it's a SCORING question (weight > 0 and scoring: true)
        if (question && question.scoring && answers[questionId] && 
            !(typeof answers[questionId] === 'object' && answers[questionId].skipped)) {
          earnedWeight += question.weight;
        }
      });
    });
    // Doctrine: TOTAL_WEIGHT = 100, so score is directly earned points
    return Math.min(Math.round((earnedWeight / TOTAL_WEIGHT) * 100), 100);
  }, [answers]);
  
  const soulScore = calculateSoulScore();
  const tier = getTier(soulScore);
  
  // Get current chapter and question
  const chapter = CHAPTERS[currentChapter];
  const question = chapter?.questions[currentQuestion];
  
  // Helper: Check if a question is already answered
  const isQuestionAnswered = useCallback((questionId) => {
    return answeredQuestionIds.has(questionId) || 
      (answers[questionId] && !(typeof answers[questionId] === 'object' && answers[questionId].skipped));
  }, [answeredQuestionIds, answers]);
  
  // Helper: Find next unanswered question index in current chapter (returns -1 if all answered)
  const findNextUnansweredInChapter = useCallback((startIndex = 0) => {
    if (!chapter) return -1;
    for (let i = startIndex; i < chapter.questions.length; i++) {
      if (!isQuestionAnswered(chapter.questions[i].id)) {
        return i;
      }
    }
    return -1; // All questions in chapter answered
  }, [chapter, isQuestionAnswered]);
  
  // Helper: Count unanswered questions in current chapter
  const countUnansweredInChapter = useCallback(() => {
    if (!chapter) return 0;
    return chapter.questions.filter(q => !isQuestionAnswered(q.id)).length;
  }, [chapter, isQuestionAnswered]);
  
  // Replace {pet} with actual pet name
  const personalize = (text) => {
    return text.replace(/{pet}/g, petName || 'your pet');
  };
  
  // Handle photo upload with AI breed detection
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPetPhoto(file);
    setPetPhotoPreview(URL.createObjectURL(file));
    
    // AI Breed Detection
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_URL}/api/detect-breed`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.detected_breed) {
          setDetectedBreed(data.detected_breed);
          setPetData(prev => ({ ...prev, breed: data.detected_breed }));
        }
      }
    } catch (error) {
      console.log('Breed detection unavailable');
    }
  };
  
  // Handle answer selection
  const handleAnswer = (value) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
    
    const questionId = question.id;
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    // Add to "Mira knows" list
    const knowledgeItem = `${personalize(question.question).replace('...', '')}: ${Array.isArray(value) ? value.join(', ') : value}`;
    setMiraKnows(prev => [...prev.slice(-9), knowledgeItem]);
    
    // Auto-save answers to backend every 5 answers
    if (Object.keys(newAnswers).length % 5 === 0) {
      saveSoulAnswers(newAnswers);
    }
    
    // Move to next UNANSWERED question or chapter complete
    // This skips questions already answered during onboarding
    setTimeout(() => {
      const nextUnanswered = findNextUnansweredInChapter(currentQuestion + 1);
      
      if (nextUnanswered !== -1) {
        // Found an unanswered question in this chapter
        setCurrentQuestion(nextUnanswered);
      } else {
        // All remaining questions in chapter are answered, go to chapter complete
        saveSoulAnswers(newAnswers);
        setScreen('chapter-complete');
      }
      setIsAnimating(false);
      setMultiSelectValues([]);
      setTextInputValue('');
    }, 300);
  };
  
  // Save soul answers to backend - CANONICAL SOURCE UPDATE
  // This updates the single source of truth that all surfaces read from
  const saveSoulAnswers = async (currentAnswers, navigateAfter = null) => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('tdb_auth_token') || localStorage.getItem('token') || localStorage.getItem('auth_token');
      if (!token) {
        console.log('[SoulBuilder] No token, skipping save');
        return false;
      }
      
      // Calculate score from all answers (including pre-existing ones)
      // DOCTRINE: Only scoring questions count (weight > 0 and scoring: true)
      const allAnswers = { ...answers, ...currentAnswers };
      let earnedWeight = 0;
      Object.keys(allAnswers).forEach(questionId => {
        CHAPTERS.forEach(chapter => {
          const question = chapter.questions.find(q => q.id === questionId);
          // ONLY count SCORING questions
          if (question && question.scoring && allAnswers[questionId] && 
              !(typeof allAnswers[questionId] === 'object' && allAnswers[questionId].skipped)) {
            earnedWeight += question.weight;
          }
        });
      });
      // DOCTRINE: TOTAL_WEIGHT = 100, score is earned/100
      const calculatedScore = Math.min(Math.round((earnedWeight / TOTAL_WEIGHT) * 100), 100);
      
      const payload = {
        pet_id: currentPetId,
        pet_name: petName,
        breed: petData.breed || detectedBreed,
        gender: petData.gender,
        birth_date: petData.birth_date,
        soul_answers: allAnswers,
        soul_score: calculatedScore,
        pet_data: petData,
        // Mark which questions have been answered (for deduplication)
        answered_question_ids: Object.keys(allAnswers).filter(k => 
          allAnswers[k] && !(typeof allAnswers[k] === 'object' && allAnswers[k].skipped)
        )
      };
      
      const response = await fetch(`${API_URL}/api/pet-soul/save-answers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('[SoulBuilder] Answers saved to canonical source. Score:', calculatedScore);
        
        // Update local state with the server-confirmed pet ID
        if (result.pet_id) {
          setCurrentPetId(result.pet_id);
        }
        
        // Navigate after successful save if requested
        if (navigateAfter === 'pet-home') {
          // Navigate with pet context
          const petId = result.pet_id || currentPetId;
          
          // Check if this is first-time Soul Profile completion (score >= 10 and no wrapped shown yet)
          const wrappedShownKey = `wrapped_shown_${petId}`;
          const hasShownWrapped = localStorage.getItem(wrappedShownKey);
          
          if (calculatedScore >= 10 && !hasShownWrapped && petId) {
            // Show Welcome Wrapped modal for first completion
            localStorage.setItem(wrappedShownKey, 'true');
            setPendingNavigation(petId);
            setShowWelcomeWrapped(true);
          } else if (petId) {
            window.location.href = `/pet-home?active_pet=${petId}`;
          } else {
            window.location.href = '/pet-home';
          }
        }
        
        return true;
      } else {
        console.error('[SoulBuilder] Save failed:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('[SoulBuilder] Save error:', error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle multi-select
  const toggleMultiSelect = (value) => {
    setMultiSelectValues(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };
  
  // Generate "What Mira Knows" synopsis from answers - CANONICAL PROFILE
  const generateMiraSynopsis = useCallback(() => {
    const allAnswers = answers;
    const synopsis = [];
    
    // Appetite / Food preferences
    if (allAnswers.favorite_protein) {
      synopsis.push({ icon: '🍖', text: `Loves ${allAnswers.favorite_protein}` });
    }
    if (allAnswers.food_allergies && !allAnswers.food_allergies.includes('none')) {
      const allergies = Array.isArray(allAnswers.food_allergies) ? allAnswers.food_allergies.join(', ') : allAnswers.food_allergies;
      synopsis.push({ icon: '⚠️', text: `Allergic to ${allergies}` });
    }
    
    // Tummy / Health
    if (allAnswers.sensitive_stomach === 'Yes' || allAnswers.health_conditions?.includes('sensitive_stomach')) {
      synopsis.push({ icon: '🤢', text: 'Sensitive tummy' });
    }
    if (allAnswers.health_conditions && !allAnswers.health_conditions.includes('none')) {
      const conditions = Array.isArray(allAnswers.health_conditions) ? allAnswers.health_conditions.filter(c => c !== 'sensitive_stomach') : [];
      if (conditions.length > 0) {
        synopsis.push({ icon: '💊', text: `Health: ${conditions.join(', ')}` });
      }
    }
    
    // Energy / Exercise
    if (allAnswers.exercise_needs) {
      synopsis.push({ icon: '⚡', text: `${allAnswers.exercise_needs} energy` });
    }
    
    // Stranger comfort
    if (allAnswers.stranger_reaction) {
      synopsis.push({ icon: '👋', text: `${allAnswers.stranger_reaction} with strangers` });
    }
    
    // Separation anxiety
    if (allAnswers.separation_anxiety === 'yes' || allAnswers.separation_anxiety === 'Severe' || allAnswers.separation_anxiety === 'Moderate') {
      synopsis.push({ icon: '💔', text: 'Needs company when alone' });
    }
    
    // Travel comfort
    if (allAnswers.car_rides) {
      synopsis.push({ icon: '🚗', text: `${allAnswers.car_rides} car rides` });
    }
    
    // Grooming
    if (allAnswers.grooming_tolerance) {
      synopsis.push({ icon: '✂️', text: `${allAnswers.grooming_tolerance} grooming` });
    }
    
    // Temperament
    if (allAnswers.general_nature || allAnswers.temperament) {
      synopsis.push({ icon: '🎭', text: `${allAnswers.general_nature || allAnswers.temperament} personality` });
    }
    
    return synopsis.slice(0, 6); // Max 6 bullets as per spec
  }, [answers]);
  
  // Get top 3 traits from answers
  const getTopTraits = useCallback(() => {
    const traits = [];
    if (answers.general_nature || answers.temperament) traits.push(answers.general_nature || answers.temperament);
    if (answers.exercise_needs) traits.push(`${answers.exercise_needs} energy`);
    if (answers.stranger_reaction) traits.push(`${answers.stranger_reaction} with people`);
    return traits.slice(0, 3);
  }, [answers]);
  
  // Navigate to Pet Home with active pet context
  const navigateToPetHome = async () => {
    setIsSaving(true);
    try {
      // Save all progress first
      const saved = await saveSoulAnswers(answers);
      if (!saved) {
        console.error('[SoulBuilder] Failed to save, showing toast');
        // Show error toast but still navigate
        import('sonner').then(({ toast }) => {
          toast.error("Couldn't save progress. Please try again.");
        });
        return;
      }
      
      // Navigate with pet context
      const petId = currentPetId;
      if (petId) {
        window.location.href = `/pet-home?active_pet=${petId}`;
      } else {
        window.location.href = '/pet-home';
      }
    } catch (error) {
      console.error('[SoulBuilder] Navigation error:', error);
      import('sonner').then(({ toast }) => {
        toast.error("Couldn't open Home. Retry.");
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get unanswered questions (excluding already answered ones)
  const getUnansweredQuestions = useCallback(() => {
    const unanswered = [];
    CHAPTERS.forEach(ch => {
      ch.questions.forEach(q => {
        // Check if question is already answered (from DB or current session)
        const isAnswered = answeredQuestionIds.has(q.id) || 
          (answers[q.id] && !(typeof answers[q.id] === 'object' && answers[q.id].skipped));
        if (!isAnswered) {
          unanswered.push({ ...q, chapterId: ch.id, chapterTitle: ch.title });
        }
      });
    });
    return unanswered;
  }, [answeredQuestionIds, answers]);
  
  // Handle skip - stores as { skipped: true }
  const handleSkip = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    // Store as skipped, not missing
    const questionId = question.id;
    setAnswers(prev => ({ ...prev, [questionId]: { skipped: true } }));
    
    setTimeout(() => {
      if (currentQuestion < chapter.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        setScreen('chapter-complete');
      }
      setIsAnimating(false);
      setMultiSelectValues([]);
      setTextInputValue('');
    }, 200);
  };
  
  // Handle next chapter - with KNOW_MIRA_SUMMARY checkpoint after first completion threshold
  const handleNextChapter = () => {
    // Count actual answers (not skipped)
    const actualAnswers = Object.keys(answers).filter(k => 
      answers[k] && !(typeof answers[k] === 'object' && answers[k].skipped)
    ).length;
    
    // After first chapter OR reaching 10-15 questions, show KNOW_MIRA_SUMMARY (COMPULSORY)
    const isFirstCheckpoint = currentChapter === 0 || actualAnswers >= 10;
    
    if (currentChapter < CHAPTERS.length - 1) {
      // After completing first significant batch, show the compulsory summary
      if (isFirstCheckpoint && actualAnswers >= 8) {
        // Save progress before showing summary
        saveSoulAnswers(answers);
        setScreen('know_mira_summary');
      } else {
        setCurrentChapter(prev => prev + 1);
        setCurrentQuestion(0);
        setScreen('chapter-intro');
      }
    } else {
      // Last chapter complete - show final summary (which is also KNOW_MIRA_SUMMARY)
      saveSoulAnswers(answers);
      setScreen('know_mira_summary');
    }
  };
  
  // Handle "Save & Exit" / "Skip for now" - persists progress and goes to Pet Home
  const handleSaveAndExit = async () => {
    setIsSaving(true);
    try {
      await saveSoulAnswers(answers);
      navigateToPetHome();
    } catch (error) {
      console.error('[SoulBuilder] Save and exit error:', error);
      // Navigate anyway
      window.location.href = '/pet-home';
    }
  };
  
  // Calculate progress
  const totalAnswered = Object.keys(answers).filter(k => 
    answers[k] && !(typeof answers[k] === 'object' && answers[k].skipped)
  ).length;
  const chapterProgress = (currentQuestion + 1) / chapter?.questions.length * 100;
  const overallProgress = ((currentChapter * 100) + chapterProgress) / CHAPTERS.length;
  
  // Check if user has existing pets (coming from "Keep Teaching Mira")
  const hasExistingPet = existingPets.length > 0;
  // Use currentPet (URL-specified) if available, otherwise fall back to first pet
  const primaryPet = currentPet || existingPets[0];
  // Use the canonical soul score from the database
  const currentSoulScore = primaryPet?.overall_score || soulScore || 0;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER SCREENS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // LOADING SCREEN - Wait for pets to load before deciding which screen to show
  if (isLoadingPets) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a19] via-[#1a1025] to-[#0f0a19] flex flex-col items-center justify-center p-6">
        <div className="w-20 h-20 mb-6">
          <div className="w-full h-full rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
        </div>
        <p className="text-white/70 text-sm">Loading your pet's profile...</p>
      </div>
    );
  }
  
  // PREBOARDING SCREEN - Different for new users vs existing users
  console.log('[SoulBuilder] Current screen:', screen);
  if (screen === 'preboarding') {
    console.log('[SoulBuilder] Rendering preboarding screen, hasExistingPet:', hasExistingPet);
    
    // EXISTING USER - Show KNOW_MIRA_SUMMARY style screen with junction choices
    if (hasExistingPet && primaryPet) {
      const synopsis = generateMiraSynopsis();
      const topTraits = getTopTraits();
      
      return (
        <div className="min-h-screen bg-gradient-to-b from-[#0f0a19] via-[#1a1025] to-[#0f0a19] flex flex-col items-center justify-center p-6" data-testid="soul-builder-returning">
          {/* Ambient glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-pink-500/20 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-md w-full">
            {/* Pet Photo & Soul Ring */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              {/* Live Soul Score Ring */}
              <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)]" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="66" fill="none" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="4" />
                <circle 
                  cx="70" cy="70" r="66" 
                  fill="none" 
                  stroke="url(#preboardGradient)" 
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(currentSoulScore / 100) * 415} 415`}
                  transform="rotate(-90 70 70)"
                  style={{ filter: 'drop-shadow(0 0 8px #8B5CF6)' }}
                />
                <defs>
                  <linearGradient id="preboardGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
              
              {primaryPet.photo ? (
                <img src={primaryPet.photo} alt={primaryPet.name} className="w-full h-full rounded-full object-cover border-4 border-purple-500/30" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <PawPrint className="w-12 h-12 text-white" />
                </div>
              )}
              {/* Soul Score Badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                {Math.round(currentSoulScore)}% Soul
              </div>
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-light text-white text-center mb-2">
              Mira knows <span className="font-semibold text-purple-400">{primaryPet.name}</span>
            </h1>
            
            {/* Top 3 Traits */}
            {topTraits.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {topTraits.map((trait, i) => (
                  <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm capitalize">
                    {trait}
                  </span>
                ))}
              </div>
            )}
            
            {/* What Mira Already Knows - Synopsis */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-white/10">
              <p className="text-white/90 text-sm font-medium mb-4 text-center">What Mira knows so far:</p>
              <div className="space-y-3">
                {synopsis.length > 0 ? synopsis.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-white/70 text-sm">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <span className="capitalize">{item.text}</span>
                  </div>
                )) : (
                  <>
                    {primaryPet.breed && (
                      <div className="flex items-center gap-3 text-white/70 text-sm">
                        <span className="text-lg">🐕</span>
                        <span>{primaryPet.breed}</span>
                      </div>
                    )}
                    {primaryPet.gender && (
                      <div className="flex items-center gap-3 text-white/70 text-sm">
                        <span className="text-lg">{primaryPet.gender === 'boy' ? '♂️' : '♀️'}</span>
                        <span>{primaryPet.gender === 'boy' ? 'Boy' : primaryPet.gender === 'girl' ? 'Girl' : primaryPet.gender}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Score growth message */}
            <p className="text-white/50 text-sm text-center mb-8">
              Your score will grow as Mira learns more about {primaryPet.name}
            </p>
            
            {/* Junction Choices - EXACTLY TWO BUTTONS */}
            <div className="space-y-3">
              {/* Primary: See Pet's Home */}
              <button
                onClick={() => {
                  const petId = primaryPet.id || primaryPet._id;
                  if (petId) {
                    window.location.href = `/pet-home?active_pet=${petId}`;
                  } else {
                    window.location.href = '/pet-home';
                  }
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                data-testid="see-pet-home-btn"
              >
                See {primaryPet.name}'s Home
              </button>
              
              {/* Secondary: Let Mira know more */}
              <button
                onClick={() => {
                  // Pre-fill pet data and go to KNOW_MORE_START
                  setPetName(primaryPet.name);
                  setPetPhotoPreview(primaryPet.photo);
                  setCurrentPetId(primaryPet.id || primaryPet._id);
                  setScreen('know_more_start');
                }}
                className="w-full py-4 px-6 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all border border-white/10"
                data-testid="let-mira-know-more-btn"
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Let Mira know more
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // NEW USER - Original "Meet Mira" screen
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a19] via-[#1a1025] to-[#0f0a19] flex flex-col items-center justify-center p-6" data-testid="soul-builder-preboarding">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-pink-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-md w-full text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-4xl font-light text-white mb-4">
            Meet <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Mira</span>
          </h1>
          
          <p className="text-white/70 text-lg mb-8">
            She becomes uncanny once she knows your pet.
          </p>
          
          {/* Benefits */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8 text-left border border-white/10">
            <p className="text-white/90 mb-4 text-center">In 6–8 minutes, you'll have:</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <span>Picks that truly suit your pet</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-pink-400" />
                </div>
                <span>Faster bookings with fewer questions</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-amber-400" />
                </div>
                <span>A Concierge® who knows your home rules</span>
              </div>
            </div>
          </div>
          
          <p className="text-white/50 text-sm mb-6 italic">
            This isn't a form. It's how Mira learns your pet.
          </p>
          
          {/* CTA Block */}
          <div className="mb-6">
            <button
              onClick={() => setScreen('pet-hook')}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              data-testid="start-soul-profile-btn"
            >
              Start Soul Profile
            </button>
            <p className="mt-2 text-white/40 text-xs text-center">
              Edit or delete anytime.
            </p>
          </div>
          
          {/* Skip - goes to Pet Home */}
          <button
            onClick={() => navigate('/pet-home')}
            className="text-white/30 hover:text-white/50 transition-colors text-sm"
            data-testid="skip-for-now-btn"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }
  
  // PET HOOK SCREEN (Photo + Name)
  if (screen === 'pet-hook') {
    const totalPets = Math.max(existingPets.length, 1);
    const currentPetIndex = existingPets.length + 1; // New pet being added
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a19] via-[#1a1025] to-[#0f0a19] flex flex-col p-6" data-testid="soul-builder-pet-hook">
        {/* Header with multi-pet context */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setScreen('preboarding')} className="text-white/50 hover:text-white">
              <ChevronLeft className="w-6 h-6" />
            </button>
            {/* Pet context - shows when name entered */}
            {petName.trim() && (
              <span className="text-white/50 text-sm">
                {petName} • Profile {currentPetIndex} of {totalPets}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Switch/Add pet control */}
            {petName.trim() && (
              <button className="text-purple-400 text-sm hover:text-purple-300 transition-colors">
                Switch / Add pet
              </button>
            )}
            <button onClick={() => navigate('/')} className="text-white/50 hover:text-white text-sm">
              Save & exit
            </button>
          </div>
        </div>
        
        {/* Multi-pet selector (if user has existing pets) */}
        {existingPets.length > 0 && (
          <div className="mb-6">
            <p className="text-white/50 text-sm mb-3 text-center">Who are we building a profile for?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {existingPets.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => {
                    setPetName(pet.name);
                    setPetPhotoPreview(pet.photo);
                  }}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/70 hover:bg-white/10 hover:border-purple-400/30 transition-all"
                >
                  {pet.name}
                </button>
              ))}
              <button className="px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300">
                + Add another
              </button>
            </div>
          </div>
        )}
        
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 -mt-8">
          {/* Title - changes when name is entered */}
          <h2 className="text-2xl text-white mb-6">
            {petName.trim() ? `Let's begin with ${petName}.` : "Let's meet your pet."}
          </h2>
          
          {/* Photo Upload - Premium feel */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative w-36 h-36 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-white/20 hover:border-purple-400/50 transition-all cursor-pointer flex items-center justify-center overflow-hidden group"
          >
            {petPhotoPreview ? (
              <img src={petPhotoPreview} alt="Pet" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center px-4">
                <Camera className="w-8 h-8 text-white/50 mx-auto mb-2 group-hover:text-purple-400 transition-colors" />
                <span className="text-white/60 text-sm group-hover:text-purple-400 transition-colors">Add a photo</span>
              </div>
            )}
            
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-pulse" />
          </div>
          
          {/* Photo helper text */}
          <p className="text-white/30 text-xs mt-2 mb-1">Optional, but it helps Mira recognise them</p>
          
          {/* Skip photo link */}
          {!petPhotoPreview && (
            <button className="text-white/40 text-xs hover:text-white/60 transition-colors mb-4">
              Skip photo for now
            </button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          
          {/* AI breed detection result */}
          {detectedBreed && (
            <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-purple-500/20 rounded-full">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">AI detected: {detectedBreed}</span>
            </div>
          )}
          
          {/* Name Input - Tighter spacing */}
          <div className="w-full max-w-xs mt-2">
            <p className="text-white/70 mb-2 text-center">What do you call them?</p>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Name"
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-full text-white text-center placeholder-white/30 focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all"
              data-testid="pet-name-input"
            />
            
            {/* Nickname field - appears after name is entered */}
            {petName.trim() && (
              <input
                type="text"
                value={petData.nickname || ''}
                onChange={(e) => setPetData(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="Also called... (optional)"
                className="w-full mt-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white text-center placeholder-white/30 text-sm focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all"
              />
            )}
            
            {/* Micro reassurance */}
            <p className="text-white/30 text-xs mt-2 text-center">You can edit this anytime.</p>
          </div>
        </div>
        
        {/* Continue Button - "Wakes up" when name entered */}
        <div className="mt-6">
          <button
            onClick={() => petName.trim() && setScreen('basic-info')}
            disabled={!petName.trim()}
            className={`w-full py-4 px-6 rounded-full font-semibold transition-all duration-300 ${
              petName.trim()
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
            }`}
            data-testid="continue-btn"
          >
            Continue →
          </button>
          
          {/* Add another pet after this */}
          {petName.trim() && (
            <p className="text-white/40 text-xs mt-3 text-center">
              Add another pet after this
            </p>
          )}
        </div>
      </div>
    );
  }
  
  // BASIC INFO SCREEN
  if (screen === 'basic-info') {
    // Common breeds for autocomplete (excluding quick options)
    const commonBreeds = [
      'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Beagle', 
      'Poodle', 'Bulldog', 'Rottweiler', 'Dachshund', 'Shih Tzu', 'Boxer',
      'Siberian Husky', 'Pomeranian', 'Doberman', 'Great Dane', 'Chihuahua',
      'Cocker Spaniel', 'Pug', 'Maltese', 'Border Collie', 'Yorkshire Terrier',
      'French Bulldog', 'Lhasa Apso', 'Indian Spitz', 'Rajapalayam', 'Mudhol Hound'
    ];
    
    const filteredBreeds = commonBreeds.filter(b => 
      b.toLowerCase().includes(breedSearch.toLowerCase())
    );
    
    // Quick breed options - mutually exclusive with typed breed
    const quickBreedOptions = ['Mixed / Indie', 'Not sure', 'Mixed Breed', 'Other'];
    
    // Handle breed selection from search - clears quick options
    const handleBreedSelect = (breed) => {
      setPetData(prev => ({ ...prev, breed }));
      setBreedSearch(breed);
      setShowBreedDropdown(false);
      setOtherBreedSelected(false);
    };
    
    // Handle quick breed option - clears typed breed
    const handleQuickBreed = (opt) => {
      if (opt === 'Other') {
        setOtherBreedSelected(true);
        setPetData(prev => ({ ...prev, breed: 'other' }));
        setBreedSearch('');
      } else {
        setOtherBreedSelected(false);
        setPetData(prev => ({ ...prev, breed: opt }));
        setBreedSearch('');
      }
      setShowBreedDropdown(false);
    };
    
    // Handle breed search input - clears quick options if typing
    const handleBreedSearchChange = (value) => {
      setBreedSearch(value);
      setShowBreedDropdown(true);
      // If user starts typing, clear quick option selection
      if (value && quickBreedOptions.includes(petData.breed)) {
        setPetData(prev => ({ ...prev, breed: '' }));
      }
    };
    
    // Age options - tightened ranges per feedback
    const ageOptions = [
      { label: 'Puppy', value: 'puppy', desc: '0-12 mo' },
      { label: 'Young', value: 'young', desc: '1-3 yrs' },
      { label: 'Adult', value: 'adult', desc: '3-7 yrs' },
      { label: 'Senior', value: 'senior', desc: '7+ yrs' }
    ];
    
    // Handle date type change - clears approximate age
    const handleDateTypeChange = (type) => {
      setDateType(type);
      setBirthdayMode('date'); // Switch to date mode when selecting date type
      setPetData(prev => ({ ...prev, approximate_age: '' })); // Clear approx age
    };
    
    // Handle approximate age selection - clears dates
    const handleApproxAgeSelect = (ageValue) => {
      setPetData(prev => ({ 
        ...prev, 
        approximate_age: ageValue, 
        birth_date: '', 
        gotcha_date: '' 
      }));
    };
    
    // Handle switching to approximate mode - clears dates
    const handleSwitchToApproximate = () => {
      setBirthdayMode('approximate');
      setPetData(prev => ({ ...prev, birth_date: '', gotcha_date: '' }));
    };
    
    // Handle switching to date mode - clears approximate
    const handleSwitchToDateMode = () => {
      setBirthdayMode('date');
      setPetData(prev => ({ ...prev, approximate_age: '' }));
    };
    
    // Format date for display (dd/mm/yyyy)
    const formatDateForDisplay = (isoDate) => {
      if (!isoDate) return '';
      const [year, month, day] = isoDate.split('-');
      return `${day}/${month}/${year}`;
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a19] via-[#1a1025] to-[#0f0a19] flex flex-col" data-testid="soul-builder-basic-info">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <button onClick={() => setScreen('pet-hook')} className="text-white/50 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => navigate('/')} className="text-white/50 hover:text-white text-sm">
            Save & finish later
          </button>
        </div>
        
        {/* Pet Header with context */}
        <div className="flex items-center gap-3 px-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 overflow-hidden border-2 border-purple-400/30 flex-shrink-0">
            {petPhotoPreview ? (
              <img src={petPhotoPreview} alt={petName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🐕</div>
            )}
          </div>
          <div>
            <h3 className="text-white font-medium">{petName}</h3>
            <p className="text-white/40 text-xs">Profile 1 of 1</p>
          </div>
        </div>
        
        <h2 className="text-lg text-white px-4 mb-4">A few quick details about {petName}</h2>
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-32">
          <div className="space-y-5">
            
            {/* Breed - Autocomplete with mutual exclusivity */}
            <div>
              <label className="text-white/70 text-sm mb-2 block">Breed</label>
              
              {/* AI Suggested breed chip */}
              {detectedBreed && petData.breed !== detectedBreed && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/50 text-xs">Suggested:</span>
                  <button 
                    onClick={() => handleBreedSelect(detectedBreed)}
                    className="px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-sm hover:bg-purple-500/30 transition-colors"
                  >
                    {detectedBreed}
                  </button>
                </div>
              )}
              
              <div className="relative">
                <input
                  type="text"
                  value={breedSearch}
                  onChange={(e) => handleBreedSearchChange(e.target.value)}
                  onFocus={() => setShowBreedDropdown(true)}
                  placeholder="Search breed..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50"
                />
                
                {/* Dropdown */}
                {showBreedDropdown && breedSearch && filteredBreeds.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1025] border border-white/10 rounded-xl max-h-48 overflow-y-auto z-20">
                    {filteredBreeds.slice(0, 6).map(breed => (
                      <button
                        key={breed}
                        onClick={() => handleBreedSelect(breed)}
                        className="w-full px-4 py-2 text-left text-white/70 hover:bg-white/10 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        {breed}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Quick options - mutually exclusive with typed breed */}
              <div className="flex flex-wrap gap-2 mt-2">
                {quickBreedOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleQuickBreed(opt)}
                    className={`px-3 py-1 rounded-full text-xs transition-all ${
                      (opt === 'Other' ? otherBreedSelected : petData.breed === opt)
                        ? 'bg-purple-500/30 border border-purple-400/50 text-purple-300'
                        : 'bg-white/5 border border-white/10 text-white/50 hover:text-white/70'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Free text input when Other is selected */}
              {otherBreedSelected && (
                <input
                  type="text"
                  placeholder="Describe your dog's breed..."
                  onChange={e => setPetData(prev => ({ ...prev, breed: e.target.value }))}
                  className="mt-2 w-full px-4 py-3 bg-white/5 border border-purple-400/30 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-400/60"
                  autoFocus
                />
              )}
            </div>
            
            {/* Gender - Compact segmented control */}
            <div>
              <label className="text-white/70 text-sm mb-2 block">Gender</label>
              <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                {['Male', 'Female'].map(g => (
                  <button
                    key={g}
                    onClick={() => setPetData(prev => ({ ...prev, gender: g }))}
                    className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all ${
                      petData.gender === g
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Birthday / Gotcha Day - mutually exclusive with approximate age */}
            <div>
              <label className="text-white/70 text-sm mb-2 block">When did {petName} come into your life?</label>
              
              {/* Date type selector: Birthday | Gotcha Day | Both */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => handleDateTypeChange('birthday')}
                  className={`flex-1 py-2 rounded-full text-sm transition-all ${
                    dateType === 'birthday' && birthdayMode === 'date'
                      ? 'bg-purple-500/30 border border-purple-400/50 text-purple-300'
                      : 'bg-white/5 border border-white/10 text-white/50'
                  }`}
                >
                  Birthday
                </button>
                <button
                  onClick={() => handleDateTypeChange('gotcha')}
                  className={`flex-1 py-2 rounded-full text-sm transition-all ${
                    dateType === 'gotcha' && birthdayMode === 'date'
                      ? 'bg-purple-500/30 border border-purple-400/50 text-purple-300'
                      : 'bg-white/5 border border-white/10 text-white/50'
                  }`}
                >
                  Gotcha Day
                </button>
                <button
                  onClick={() => handleDateTypeChange('both')}
                  className={`flex-1 py-2 rounded-full text-sm transition-all ${
                    dateType === 'both' && birthdayMode === 'date'
                      ? 'bg-purple-500/30 border border-purple-400/50 text-purple-300'
                      : 'bg-white/5 border border-white/10 text-white/50'
                  }`}
                >
                  Both
                </button>
              </div>
              
              {/* Approximate age toggle - mutually exclusive with dates */}
              <button
                onClick={birthdayMode === 'date' ? handleSwitchToApproximate : handleSwitchToDateMode}
                className={`w-full mb-3 px-3 py-2 rounded-xl text-xs text-left transition-all ${
                  birthdayMode === 'approximate'
                    ? 'bg-purple-500/20 border border-purple-400/50 text-purple-300'
                    : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/60'
                }`}
              >
                {birthdayMode === 'approximate' 
                  ? '✓ Using approximate age (tap to enter date instead)'
                  : "Don't know exact date? Tap to estimate age"
                }
              </button>
              
              {birthdayMode === 'date' ? (
                <div className="space-y-3">
                  {/* Birthday field */}
                  {(dateType === 'birthday' || dateType === 'both') && (
                    <div>
                      {dateType === 'both' && (
                        <label className="text-white/40 text-xs mb-1 block">Birthday</label>
                      )}
                      <input
                        type="date"
                        value={petData.birth_date}
                        onChange={(e) => setPetData(prev => ({ ...prev, birth_date: e.target.value, approximate_age: '' }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-400/50"
                        style={{ colorScheme: 'dark' }}
                      />
                      {petData.birth_date && (
                        <p className="text-white/30 text-xs mt-1">{formatDateForDisplay(petData.birth_date)}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Gotcha Day field */}
                  {(dateType === 'gotcha' || dateType === 'both') && (
                    <div>
                      {dateType === 'both' && (
                        <label className="text-white/40 text-xs mb-1 block">Gotcha Day (adoption date)</label>
                      )}
                      <input
                        type="date"
                        value={petData.gotcha_date}
                        onChange={(e) => setPetData(prev => ({ ...prev, gotcha_date: e.target.value, approximate_age: '' }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-400/50"
                        style={{ colorScheme: 'dark' }}
                      />
                      {petData.gotcha_date && (
                        <p className="text-white/30 text-xs mt-1">{formatDateForDisplay(petData.gotcha_date)}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {ageOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleApproxAgeSelect(opt.value)}
                      className={`py-3 rounded-xl text-center transition-all ${
                        petData.approximate_age === opt.value
                          ? 'bg-purple-500/20 border border-purple-400/50 text-purple-300'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-xs opacity-60">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Spayed / Neutered - Compact */}
            <div>
              <label className="text-white/70 text-sm mb-2 block">Spayed / neutered?</label>
              <div className="flex gap-2">
                {[{ label: 'Yes', value: true }, { label: 'No', value: false }, { label: 'Not sure', value: null }].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setPetData(prev => ({ ...prev, is_neutered: opt.value }))}
                    className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
                      petData.is_neutered === opt.value
                        ? 'bg-purple-500/20 border border-purple-400/50 text-purple-300'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Weight - Important for Fit pillar recommendations */}
            <div>
              <label className="text-white/70 text-sm mb-2 block">Weight <span className="text-white/40">(helps with fitness & portion tips)</span></label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    placeholder="Enter weight"
                    value={petData.weight}
                    onChange={(e) => setPetData(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50"
                    data-testid="weight-input"
                  />
                </div>
                <div className="flex gap-1">
                  {['kg', 'lbs'].map(unit => (
                    <button
                      key={unit}
                      onClick={() => setPetData(prev => ({ ...prev, weight_unit: unit }))}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        petData.weight_unit === unit
                          ? 'bg-purple-500/20 border border-purple-400/50 text-purple-300'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:border-white/20'
                      }`}
                      data-testid={`weight-unit-${unit}`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
              {/* Quick weight presets based on common dog sizes */}
              <div className="flex gap-2 mt-2 flex-wrap">
                {[
                  { label: 'Small', range: '2-10', emoji: '🐕' },
                  { label: 'Medium', range: '10-25', emoji: '🦮' },
                  { label: 'Large', range: '25-45', emoji: '🐕‍🦺' },
                  { label: 'Giant', range: '45+', emoji: '🐾' }
                ].map(size => (
                  <button
                    key={size.label}
                    onClick={() => {
                      const midWeight = size.label === 'Small' ? '6' : size.label === 'Medium' ? '18' : size.label === 'Large' ? '35' : '50';
                      setPetData(prev => ({ ...prev, weight: midWeight, weight_unit: 'kg' }));
                    }}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/50 text-xs hover:border-white/20 hover:text-white/70 transition-all"
                    data-testid={`weight-preset-${size.label.toLowerCase()}`}
                  >
                    {size.emoji} {size.label} ({size.range}kg)
                  </button>
                ))}
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Fixed bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f0a19] via-[#0f0a19] to-transparent pt-8">
          <button
            onClick={() => {
              console.log('[SoulBuilder] Continue clicked - going to chapter-intro');
              setCurrentChapter(0);
              setCurrentQuestion(0);
              setScreen('chapter-intro');
            }}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            data-testid="continue-to-chapters-btn"
          >
            Continue →
          </button>
          <button
            onClick={() => {
              console.log('[SoulBuilder] Skip clicked - going to chapter-intro');
              setCurrentChapter(0);
              setCurrentQuestion(0);
              setScreen('chapter-intro');
            }}
            className="w-full py-2 mt-2 text-white/40 text-sm hover:text-white/60 transition-colors"
            data-testid="skip-details-btn"
          >
            Skip these details
          </button>
        </div>
      </div>
    );
  }
  
  // CHAPTER INTRO SCREEN
  if (screen === 'chapter-intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a19] via-[#1a1025] to-[#0f0a19] flex flex-col items-center justify-center p-6" data-testid="soul-builder-chapter-intro">
        {/* Ambient glow with chapter color */}
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-30"
          style={{ backgroundColor: chapter.color }}
        />
        
        <div className="relative z-10 text-center">
          {/* Pet Avatar with Soul rings - Dynamic glow based on score */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            {/* Outer animated rings */}
            <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)]" viewBox="0 0 140 140">
              {/* Background ring */}
              <circle 
                cx="70" cy="70" r="66" 
                fill="none" 
                stroke="rgba(139, 92, 246, 0.15)" 
                strokeWidth="3"
              />
              {/* Progress ring - only shows after first answer */}
              {hasAnsweredAny && (
                <circle 
                  cx="70" cy="70" r="66" 
                  fill="none" 
                  stroke="url(#soulGradient)" 
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(soulScore / 100) * 415} 415`}
                  transform="rotate(-90 70 70)"
                  className="transition-all duration-1000"
                  style={{
                    filter: soulScore > 0 ? `drop-shadow(0 0 6px ${chapter.color})` : 'none'
                  }}
                />
              )}
              <defs>
                <linearGradient id="soulGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Inner photo container */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 overflow-hidden">
              {petPhotoPreview ? (
                <img src={petPhotoPreview} alt={petName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🐕</div>
              )}
            </div>
            
            {/* Soul badge - "Soul Profile" before answers, dynamic score after */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-medium whitespace-nowrap">
              {hasAnsweredAny ? `${soulScore}%` : 'Soul Profile'}
            </div>
          </div>
          
          {/* Chapter Info - Cleaner hierarchy */}
          <p className="text-white/50 text-sm mb-3">
            Chapter {currentChapter + 1} <span className="text-white/30">of {CHAPTERS.length}</span>
          </p>
          
          {/* Chapter emoji - single visual language */}
          <div className="text-5xl mb-4">{chapter.emoji}</div>
          
          <h2 className="text-2xl text-white font-medium mb-2">{chapter.title}</h2>
          
          {/* Tighter description */}
          <p className="text-white/50 mb-6">
            {chapter.questions.length} questions about {chapter.description.toLowerCase().replace('their', petName + "'s").replace('who they are at', petName + "'s")}
          </p>
          
          {/* Tier badge - cleaner, no paw emoji */}
          {hasAnsweredAny && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-xl">{tier.emoji}</span>
              <span className="text-white/70 text-sm">{tier.name}</span>
            </div>
          )}
          
          {/* Show how many questions remain in this chapter */}
          {countUnansweredInChapter() < chapter.questions.length && (
            <p className="text-green-400/70 text-sm mb-4">
              ✓ {chapter.questions.length - countUnansweredInChapter()} already answered from onboarding
            </p>
          )}
          
          {/* Begin Button - skip to first unanswered question */}
          <button
            onClick={() => {
              const firstUnanswered = findNextUnansweredInChapter(0);
              if (firstUnanswered !== -1) {
                setCurrentQuestion(firstUnanswered);
                setScreen('question');
              } else {
                // All questions answered, skip to chapter complete
                handleNextChapter();
              }
            }}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            data-testid="begin-chapter-btn"
          >
            {countUnansweredInChapter() === 0 ? 'Continue' : 
             countUnansweredInChapter() < chapter.questions.length ? `Continue (${countUnansweredInChapter()} left)` : 'Begin'}
          </button>
          
          {/* Subtle secondary action - reduces anxiety */}
          <button
            onClick={() => {
              // Skip entire chapter
              const chapterQuestions = chapter.questions;
              const newAnswers = { ...answers };
              chapterQuestions.forEach(q => {
                newAnswers[q.id] = { skipped: true };
              });
              setAnswers(newAnswers);
              handleNextChapter();
            }}
            className="block mx-auto mt-4 text-white/30 text-sm hover:text-white/50 transition-colors"
          >
            Skip this chapter
          </button>
        </div>
      </div>
    );
  }
  
  // QUESTION SCREEN
  if (screen === 'question' && question) {
    const isMultiSelect = question.type === 'multi_select';
    const isText = question.type === 'text';
    const isThreeWordsQuestion = question.id === 'describe_3_words';
    
    // Format question text - shorter, cleaner
    const formatQuestion = (text) => {
      let formatted = personalize(text);
      // Make questions shorter and cleaner
      if (formatted.startsWith('What are ')) {
        formatted = formatted.replace('What are ', '');
      }
      // Remove trailing "?" for cleaner look, we'll add it back
      formatted = formatted.replace(/\?$/, '');
      return formatted + '?';
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a19] via-[#1a1025] to-[#0f0a19] flex flex-col" data-testid="soul-builder-question">
        {/* Header */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => {
                if (currentQuestion > 0) {
                  setCurrentQuestion(prev => prev - 1);
                } else if (currentChapter > 0) {
                  setCurrentChapter(prev => prev - 1);
                  setCurrentQuestion(CHAPTERS[currentChapter - 1].questions.length - 1);
                } else {
                  setScreen('basic-info');
                }
              }} 
              className="text-white/50 hover:text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={() => navigate('/')} className="text-white/50 hover:text-white text-sm">
              Save & finish later
            </button>
          </div>
          
          {/* Progress Bar with clear labeling */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-white/50 text-xs mb-1">
              <span className="text-white/70 font-medium">{chapter.title}</span>
              <span>Question {currentQuestion + 1} of {chapter.questions.length}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${chapterProgress}%`,
                  background: `linear-gradient(90deg, ${chapter.color}, #EC4899)`
                }}
              />
            </div>
            {/* Overall progress hint */}
            <div className="text-white/30 text-xs mt-1 text-right">
              Chapter {currentChapter + 1} of {CHAPTERS.length}
            </div>
          </div>
        </div>
        
        {/* Pet Avatar + Soul badge - compact */}
        <div className="flex items-center justify-center gap-3 py-3">
          <div className="relative">
            {/* Avatar with dynamic ring */}
            <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)]" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="37" fill="none" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="2" />
              {hasAnsweredAny && (
                <circle 
                  cx="40" cy="40" r="37" 
                  fill="none" 
                  stroke="url(#questionSoulGradient)" 
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${(soulScore / 100) * 232} 232`}
                  transform="rotate(-90 40 40)"
                  className="transition-all duration-500"
                  style={{ filter: `drop-shadow(0 0 4px ${chapter.color})` }}
                />
              )}
              <defs>
                <linearGradient id="questionSoulGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 overflow-hidden">
              {petPhotoPreview ? (
                <img src={petPhotoPreview} alt={petName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">🐕</div>
              )}
            </div>
          </div>
          <div className="text-left">
            {/* Show "Soul Profile" or "Building profile..." before first answer, then score */}
            <p className="text-white text-sm font-medium">
              {hasAnsweredAny ? `Soul Score: ${soulScore}%` : 'Building profile...'}
            </p>
            <p className="text-white/40 text-xs">{tier.emoji} {tier.name}</p>
          </div>
        </div>
        
        {/* Question - scrollable area */}
        <div className="flex-1 flex flex-col px-6 py-4 overflow-y-auto" style={{ paddingBottom: isText ? '180px' : '100px' }}>
          <h2 className="text-xl text-white text-center mb-6 max-w-sm mx-auto">
            {formatQuestion(question.question)}
          </h2>
          
          {/* Show if already answered from onboarding */}
          {answers[question.id] && (
            <div className="mb-4 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm text-center">
              <Check className="w-4 h-4 inline mr-2" />
              Already answered from onboarding • You can change it below
            </div>
          )}
          
          {/* Options */}
          {isText ? (
            <div className="w-full max-w-sm mx-auto">
              {/* Helper text for "three words" question */}
              {isThreeWordsQuestion && (
                <p className="text-white/40 text-sm text-center mb-3">
                  For example: gentle, curious, affectionate
                </p>
              )}
              
              <textarea
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                placeholder={question.placeholder || (isThreeWordsQuestion ? "Type three words..." : "Type your answer...")}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50 resize-none"
                data-testid="text-input"
              />
              
              {/* Suggestion chips for "three words" */}
              {isThreeWordsQuestion && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {THREE_WORDS_SUGGESTIONS.slice(0, 8).map(word => (
                    <button
                      key={word}
                      onClick={() => {
                        const currentWords = textInputValue.split(',').map(w => w.trim()).filter(Boolean);
                        if (currentWords.length < 3 && !currentWords.includes(word)) {
                          const newValue = currentWords.length > 0 
                            ? `${textInputValue.trim()}, ${word}`
                            : word;
                          setTextInputValue(newValue);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        textInputValue.toLowerCase().includes(word.toLowerCase())
                          ? 'bg-purple-500/30 border border-purple-400/50 text-purple-300'
                          : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white/70'
                      }`}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-sm mx-auto space-y-3">
              {question.options.map((option, idx) => {
                const isSelected = isMultiSelect 
                  ? multiSelectValues.includes(option)
                  : answers[question.id] === option;
                  
                return (
                  <button
                    key={idx}
                    onClick={() => isMultiSelect ? toggleMultiSelect(option) : handleAnswer(option)}
                    className={`w-full py-4 px-5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-400/50 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {isSelected && <Check className="w-5 h-5 text-purple-400" />}
                    </div>
                  </button>
                );
              })}
              
              {isMultiSelect && multiSelectValues.length > 0 && (
                <>
                  {question.id === 'health_conditions' && multiSelectValues.includes('Other chronic condition') && (
                    <input
                      type="text"
                      placeholder="Please describe the condition..."
                      onChange={e => setPetData(prev => ({ ...prev, health_condition_other: e.target.value }))}
                      className="mt-2 w-full p-2 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/10 focus:outline-none focus:border-purple-400/50"
                    />
                  )}
                  <button
                    onClick={() => handleAnswer(multiSelectValues)}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl"
                  >
                    Continue
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* Skip - softer wording */}
          <button 
            onClick={handleSkip}
            className="mt-6 text-white/30 hover:text-white/50 transition-colors text-sm mx-auto block"
          >
            Skip for now
          </button>
        </div>
        
        {/* Fixed bottom area for text input - keyboard safe */}
        {isText && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f0a19] via-[#0f0a19]/95 to-transparent pt-6 safe-area-inset-bottom">
            <button
              onClick={() => textInputValue.trim() && handleAnswer(textInputValue.trim())}
              disabled={!textInputValue.trim()}
              className={`w-full py-4 rounded-full font-medium transition-all ${
                textInputValue.trim()
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
              data-testid="continue-btn"
            >
              Continue
            </button>
          </div>
        )}
        
        {/* Footer - Cleaner microcopy, no lock emoji */}
        <div className="p-4 border-t border-white/5">
          <p className="text-center text-white/30 text-xs">
            Saved to {petName}'s profile
          </p>
        </div>
      </div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // KNOW_MIRA_SUMMARY SCREEN - COMPULSORY CHECKPOINT (NO SKIPPING)
  // This is THE canonical summary of what Mira knows about the pet
  // ═══════════════════════════════════════════════════════════════════════════════
  if (screen === 'know_mira_summary') {
    const synopsis = generateMiraSynopsis();
    const topTraits = getTopTraits();
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a19] via-[#1a1025] to-[#0f0a19] flex flex-col items-center justify-center p-6" data-testid="know-mira-summary">
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-pink-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-md w-full">
          {/* Pet Photo + Soul Ring */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            {/* Live Soul Score Ring */}
            <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)]" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="66" fill="none" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="4" />
              <circle 
                cx="70" cy="70" r="66" 
                fill="none" 
                stroke="url(#summaryGradient)" 
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${(currentSoulScore / 100) * 415} 415`}
                transform="rotate(-90 70 70)"
                style={{ filter: 'drop-shadow(0 0 8px #8B5CF6)' }}
              />
              <defs>
                <linearGradient id="summaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            
            {petPhotoPreview ? (
              <img src={petPhotoPreview} alt={petName} className="w-full h-full rounded-full object-cover border-4 border-purple-500/30" />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <PawPrint className="w-12 h-12 text-white" />
              </div>
            )}
            
            {/* Soul Score Badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-bold text-sm shadow-lg">
              {Math.round(currentSoulScore)}% Soul
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-light text-white text-center mb-2">
            Mira knows <span className="font-semibold text-purple-400">{petName}</span>
          </h1>
          
          {/* Top 3 Traits */}
          {topTraits.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {topTraits.map((trait, i) => (
                <span key={i} className="px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm capitalize">
                  {trait}
                </span>
              ))}
            </div>
          )}
          
          {/* Synopsis - What Mira has learned (max 6 bullets) */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-white/10">
            <p className="text-white/90 text-sm font-medium mb-4 text-center">What Mira knows so far:</p>
            <div className="space-y-3">
              {synopsis.length > 0 ? synopsis.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-white/70 text-sm">
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <span className="capitalize">{item.text}</span>
                </div>
              )) : (
                <p className="text-white/50 text-center text-sm">
                  {petName}'s profile is just getting started!
                </p>
              )}
            </div>
          </div>
          
          {/* Score growth message */}
          <p className="text-white/50 text-sm text-center mb-8">
            Your score will grow as Mira learns more about {petName}
          </p>
          
          {/* Junction Choices - EXACTLY TWO BUTTONS */}
          <div className="space-y-3">
            {/* Primary: See Pet's Home */}
            <button
              onClick={navigateToPetHome}
              disabled={isSaving}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50"
              data-testid="see-pet-home-btn"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>See {petName}'s Home</>
              )}
            </button>
            
            {/* Secondary: Let Mira know more */}
            <button
              onClick={() => {
                // Go to KNOW_MORE_START which shows synopsis then continues questions
                setScreen('know_more_start');
              }}
              className="w-full py-4 px-6 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all border border-white/10"
              data-testid="let-mira-know-more-btn"
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Let Mira know more
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // KNOW_MORE_START SCREEN - Shows current state before continuing
  // Soul score STARTS from current persisted score and only goes UP
  // Questions asked are BEYOND what's already answered
  // ═══════════════════════════════════════════════════════════════════════════════
  if (screen === 'know_more_start') {
    const synopsis = generateMiraSynopsis();
    const unansweredQuestions = getUnansweredQuestions();
    const hasMoreQuestions = unansweredQuestions.length > 0;
    
    // Find the next chapter/question to continue from
    const findNextQuestion = () => {
      for (let chIdx = 0; chIdx < CHAPTERS.length; chIdx++) {
        const ch = CHAPTERS[chIdx];
        for (let qIdx = 0; qIdx < ch.questions.length; qIdx++) {
          const q = ch.questions[qIdx];
          const isAnswered = answeredQuestionIds.has(q.id) || 
            (answers[q.id] && !(typeof answers[q.id] === 'object' && answers[q.id].skipped));
          if (!isAnswered) {
            return { chapterIndex: chIdx, questionIndex: qIdx };
          }
        }
      }
      return null;
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a19] via-[#1a1025] to-[#0f0a19] flex flex-col p-6" data-testid="know-more-start">
        {/* Header with back */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setScreen('know_mira_summary')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button 
            onClick={handleSaveAndExit}
            disabled={isSaving}
            className="text-white/50 hover:text-white text-sm"
          >
            {isSaving ? 'Saving...' : 'Save & exit'}
          </button>
        </div>
        
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          {/* Pet photo with current score */}
          <div className="relative w-24 h-24 mb-6">
            <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)]" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="3" />
              <circle 
                cx="60" cy="60" r="56" 
                fill="none" 
                stroke="url(#continueGradient)" 
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(currentSoulScore / 100) * 352} 352`}
                transform="rotate(-90 60 60)"
              />
              <defs>
                <linearGradient id="continueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            
            {petPhotoPreview ? (
              <img src={petPhotoPreview} alt={petName} className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-3xl">
                🐕
              </div>
            )}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-xs font-bold">
              {Math.round(currentSoulScore)}%
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-xl text-white text-center mb-2">
            Here's what Mira already knows about {petName}
          </h2>
          
          {/* Short synopsis */}
          <div className="bg-white/5 rounded-xl p-4 mb-6 max-w-sm w-full border border-white/10">
            {synopsis.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-white/70 text-sm py-1">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="capitalize">{item.text}</span>
              </div>
            ))}
            {synopsis.length === 0 && (
              <p className="text-white/50 text-sm text-center">Just getting started!</p>
            )}
          </div>
          
          {hasMoreQuestions ? (
            <>
              <p className="text-white/50 text-sm mb-6 text-center">
                {unansweredQuestions.length} more questions to help Mira understand {petName} better
              </p>
              
              {/* Continue button */}
              <button
                onClick={() => {
                  const next = findNextQuestion();
                  if (next) {
                    setCurrentChapter(next.chapterIndex);
                    setCurrentQuestion(next.questionIndex);
                    setScreen('question');
                  } else {
                    // All questions answered
                    setScreen('know_mira_summary');
                  }
                }}
                className="w-full max-w-sm py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30"
                data-testid="continue-questions-btn"
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <p className="text-white/50 text-sm mb-6 text-center">
                You've answered all available questions!
              </p>
              
              <button
                onClick={navigateToPetHome}
                disabled={isSaving}
                className="w-full max-w-sm py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full"
                data-testid="go-to-home-btn"
              >
                {isSaving ? 'Saving...' : `Go to ${petName}'s Home`}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
  
  // CHAPTER COMPLETE SCREEN
  if (screen === 'chapter-complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a19] via-[#1a1025] to-[#0f0a19] flex flex-col items-center justify-center p-6" data-testid="soul-builder-chapter-complete">
        {/* Ambient glow */}
        <div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none opacity-30"
          style={{ backgroundColor: chapter.color }}
        />
        
        <div className="relative z-10 text-center max-w-sm">
          {/* Pet Avatar with dynamic ring */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            {/* SVG Ring showing progress */}
            <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)]" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="3" />
              <circle 
                cx="60" cy="60" r="56" 
                fill="none" 
                stroke="#22C55E" 
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(soulScore / 100) * 352} 352`}
                transform="rotate(-90 60 60)"
                style={{ filter: 'drop-shadow(0 0 6px #22C55E)' }}
              />
            </svg>
            
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 overflow-hidden">
              {petPhotoPreview ? (
                <img src={petPhotoPreview} alt={petName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🐕</div>
              )}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 rounded-full text-white text-sm font-medium">
              {soulScore}%
            </div>
          </div>
          
          {/* Complete Message */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Check className="w-6 h-6 text-green-400" />
            <span className="text-green-400 font-medium">Chapter {currentChapter + 1} Complete</span>
          </div>
          
          <h2 className="text-2xl text-white mb-2">{chapter.emoji} {chapter.title}</h2>
          
          {/* Micro-confirmation */}
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
            <p className="text-white/70 italic text-sm">"{personalize(chapter.confirmation)}"</p>
          </div>
          
          {/* What Mira Knows */}
          {miraKnows.length > 0 && (
            <div className="text-left mb-6">
              <p className="text-white/50 text-sm mb-2">What Mira now knows:</p>
              <div className="space-y-1">
                {miraKnows.slice(-4).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-white/70 text-sm">
                    <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <span className="truncate">{item.split(':')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Next Chapter Button */}
          <button
            onClick={handleNextChapter}
            className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30"
            data-testid="next-chapter-btn"
          >
            {currentChapter < CHAPTERS.length - 1 
              ? `Next: ${CHAPTERS[currentChapter + 1].title}`
              : 'See What Mira Knows'
            }
          </button>
          
          <button
            onClick={handleSaveAndExit}
            disabled={isSaving}
            className="mt-4 text-white/30 hover:text-white/50 text-sm"
          >
            {isSaving ? 'Saving...' : 'Save & exit'}
          </button>
        </div>
      </div>
    );
  }
  
  // FINAL COMPLETION SCREEN - Redirect to KNOW_MIRA_SUMMARY
  // The "final" screen should now go to the compulsory summary checkpoint
  if (screen === 'final') {
    // Redirect to know_mira_summary
    setScreen('know_mira_summary');
    return null;
  }
  
  // LEGACY FINAL SCREEN (keeping for backwards compatibility but should not be reached)
  if (screen === 'final_legacy') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a19] via-[#1a1025] to-[#0f0a19] flex flex-col items-center justify-center p-6" data-testid="soul-builder-final">
        {/* Celebration glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[150px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-pink-500/30 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-sm">
          {/* Pet Avatar with full glowing rings */}
          <div className="relative w-36 h-36 mx-auto mb-6">
            {/* Animated SVG rings */}
            <svg className="absolute -inset-6 w-[calc(100%+48px)] h-[calc(100%+48px)]" viewBox="0 0 200 200">
              {/* Outer glow ring */}
              <circle 
                cx="100" cy="100" r="94" 
                fill="none" 
                stroke="rgba(139, 92, 246, 0.2)" 
                strokeWidth="2"
              />
              {/* Progress ring - full */}
              <circle 
                cx="100" cy="100" r="94" 
                fill="none" 
                stroke="url(#finalGradient)" 
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(soulScore / 100) * 591} 591`}
                transform="rotate(-90 100 100)"
                style={{ filter: 'drop-shadow(0 0 8px #8B5CF6)' }}
              />
              {/* Inner ring */}
              <circle 
                cx="100" cy="100" r="86" 
                fill="none" 
                stroke="rgba(236, 72, 153, 0.3)" 
                strokeWidth="1"
              />
              <defs>
                <linearGradient id="finalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 overflow-hidden">
              {petPhotoPreview ? (
                <img src={petPhotoPreview} alt={petName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">🐕</div>
              )}
            </div>
            
            {/* Score badge */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-bold shadow-lg shadow-purple-500/50">
              {soulScore}%
            </div>
          </div>
          
          <h1 className="text-2xl text-white font-medium mb-2">
            {petName}'s Soul Profile is ready
          </h1>
          
          {/* Tier */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-2xl">{tier.emoji}</span>
            <span className="text-white text-lg">{tier.name}</span>
          </div>
          
          {/* Benefits unlocked */}
          <div className="bg-white/5 rounded-xl p-5 mb-6 border border-white/10 text-left">
            <p className="text-white/90 mb-3 text-center text-sm">From now on:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Picks will be tailored to {petName}</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Services will pre-fill the right details</span>
              </div>
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Concierge® will already know what matters</span>
              </div>
            </div>
          </div>
          
          {/* To reach 100% */}
          {soulScore < 100 && (
            <div className="bg-purple-500/10 rounded-xl p-4 mb-6 border border-purple-400/20 text-left">
              <p className="text-purple-300 text-sm mb-2">To grow {petName}'s profile:</p>
              <div className="space-y-1 text-white/60 text-xs">
                <div>• Complete Health Vault (+15%)</div>
                <div>• Upload documents (+10%)</div>
                <div>• Keep chatting with Mira (+3%)</div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={async () => {
                await saveSoulAnswers(answers);
                navigate('/mira-search');
              }}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg shadow-purple-500/30"
              data-testid="go-to-today-btn"
            >
              Go to Today
            </button>
            
            {/* Add another pet */}
            <button
              onClick={async () => {
                await saveSoulAnswers(answers);
                // Reset state for a new pet
                setPetName('');
                setPetPhoto(null);
                setPetPhotoPreview(null);
                setDetectedBreed('');
                setPetData({ breed: '', gender: '', birth_date: '', gotcha_date: '', is_neutered: null, approximate_age: '' });
                setCurrentChapter(0);
                setCurrentQuestion(0);
                setAnswers({});
                setMiraKnows([]);
                setScreen('pet-hook');
              }}
              className="w-full py-3 px-6 border-2 border-purple-500/50 text-purple-300 font-medium rounded-full hover:bg-purple-500/10 transition-colors"
              data-testid="add-another-pet-btn"
            >
              + Add Another Pet's Soul Profile
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 px-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors text-sm"
              >
                See {petName}'s MOJO
              </button>
              <button
                onClick={() => navigate('/mira-search')}
                className="flex-1 py-3 px-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors text-sm"
              >
                Ask Mira
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Handle Welcome Wrapped modal close
  const handleWelcomeWrappedClose = () => {
    setShowWelcomeWrapped(false);
    if (pendingNavigation) {
      window.location.href = `/pet-home?active_pet=${pendingNavigation}`;
    } else {
      window.location.href = '/pet-home';
    }
  };
  
  // Render Welcome Wrapped Modal if triggered
  if (showWelcomeWrapped) {
    return (
      <WelcomeWrappedModal
        isOpen={showWelcomeWrapped}
        onClose={handleWelcomeWrappedClose}
        petId={pendingNavigation || currentPetId}
        petData={{
          name: petName,
          breed: petData.breed || detectedBreed,
          soul_score: soulScore
        }}
      />
    );
  }
  
  return null;
};

export default SoulBuilder;
