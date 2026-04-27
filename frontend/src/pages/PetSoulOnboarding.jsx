/**
 * PetSoulOnboarding.jsx — The Soul Builder
 * The Doggy Company
 *
 * 51 questions · 8 chapters · Live soul score ring
 * Gamified — points, animations, Mira speaks personally
 *
 * Route: /soul-builder AND /onboarding
 * After completion: navigate('/pet-home')
 *
 * API: POST /api/pet-soul/profile/{petId}/answer
 *      { question_id, answer }
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

// ── Fonts ──────────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');`;

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  night:   "#0A0A0F",
  deep:    "#0F0A1E",
  mid:     "#1A1040",
  amber:   "#C9973A",
  amberL:  "#E8B84B",
  ivory:   "#F5F0E8",
  muted:   "rgba(245,240,232,0.55)",
  dim:     "rgba(245,240,232,0.25)",
  purple:  "#9B59B6",
  pink:    "#E91E8C",
  border:  "rgba(255,255,255,0.08)",
  amberB:  "rgba(201,151,58,0.2)",
};

// ── The 3 required keys — cannot be skipped ───────────────────────────────
const REQUIRED_KEYS = new Set(['age_stage', 'food_allergies', 'health_conditions']);
const CHAPTERS = [
  {
    id:    "identity",
    label: "Identity & Temperament",
    emoji: "\u{1F3AD}",
    color: "#9B59B6",
    miraIntro: "Let's start with who {name} really is \u2014 their personality, their spirit.",
    questions: [
      {
        key:   "age_stage",
        pts:   10,
        required: true,
        text:  "How old is {name}?",
        mira:  "\"Age shapes everything \u2014 energy, diet, what Mira recommends.\"",
        type:  "choice",
        options: [
          { label: "Puppy (0\u20131 year)",     value: "puppy",  emoji: "\u{1F436}" },
          { label: "Young adult (1\u20133 yrs)", value: "young",  emoji: "\u{1F415}" },
          { label: "Adult (3\u20137 years)",     value: "adult",  emoji: "\u{1F9AE}" },
          { label: "Senior (7+ years)",     value: "senior", emoji: "\u{1F43E}" },
        ]
      },
      {
        key:   "gender",
        pts:   5,
        text:  "Is {name} a boy or a girl?",
        mira:  "\"Just so I know how to refer to {name} \u2014 the right pronouns matter.\"",
        type:  "choice",
        options: [
          { label: "Boy",   value: "male",   emoji: "\u{1F499}" },
          { label: "Girl",  value: "female", emoji: "\u{1F497}" },
        ]
      },
      {
        key:   "energy_level",
        pts:   10,
        text:  "What's {name}'s energy like?",
        mira:  "\"This tells me what play, walks, and activities will make {name} happiest.\"",
        type:  "choice",
        options: [
          { label: "Very high \u2014 always on", value: "very_high", emoji: "\u26A1" },
          { label: "High \u2014 loves activity",  value: "high",     emoji: "\u{1F3C3}" },
          { label: "Medium \u2014 balanced",      value: "medium",   emoji: "\u{1F3AF}" },
          { label: "Low \u2014 calm and steady",  value: "low",      emoji: "\u{1F33F}" },
        ]
      },
      {
        key:   "personality_primary",
        pts:   10,
        text:  "Which word best describes {name}?",
        mira:  "\"One word can tell me so much about a dog's soul.\"",
        type:  "choice",
        options: [
          { label: "Playful",    value: "playful",    emoji: "\u{1F3BE}" },
          { label: "Gentle",     value: "gentle",     emoji: "\u{1F338}" },
          { label: "Brave",      value: "brave",      emoji: "\u{1F981}" },
          { label: "Curious",    value: "curious",    emoji: "\u{1F50D}" },
        ]
      },
      {
        key:   "neutered",
        pts:   5,
        text:  "Is {name} spayed or neutered?",
        mira:  "\"This affects health recommendations and some behaviours I track.\"",
        type:  "choice",
        options: [
          { label: "Yes",        value: "yes", emoji: "\u2713" },
          { label: "No",         value: "no",  emoji: "\u2717" },
          { label: "Not sure",   value: "unknown", emoji: "?" },
        ]
      },
      {
        key:   "weight_range",
        pts:   5,
        text:  "How much does {name} weigh?",
        mira:  "\"Size matters for dosing, treats, and activity recommendations.\"",
        type:  "choice",
        options: [
          { label: "Under 5 kg (Tiny)",  value: "tiny",   emoji: "\u{1F43E}" },
          { label: "5\u201315 kg (Small)",    value: "small",  emoji: "\u{1F415}" },
          { label: "15\u201330 kg (Medium)",  value: "medium", emoji: "\u{1F9AE}" },
          { label: "30+ kg (Large)",     value: "large",  emoji: "\u{1F402}" },
        ]
      },
    ]
  },
  {
    id:    "family",
    label: "Family & Pack",
    emoji: "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    color: "#E91E8C",
    miraIntro: "Tell me about {name}'s world \u2014 the people and animals they love.",
    questions: [
      {
        key:   "social_with_dogs",
        pts:   10,
        text:  "How is {name} with other dogs?",
        mira:  "\"I use this for play dates, boarding, and NearMe \u2014 to keep {name} safe and happy.\"",
        type:  "choice",
        options: [
          { label: "Loves everyone",     value: "social",    emoji: "\u{1F970}" },
          { label: "Selective",          value: "selective", emoji: "\u{1F914}" },
          { label: "Can be reactive",    value: "reactive",  emoji: "\u26A0\uFE0F" },
          { label: "Prefers solo",       value: "solo",      emoji: "\u{1F9D8}" },
        ]
      },
      {
        key:   "social_with_strangers",
        pts:   10,
        text:  "How does {name} react to new people?",
        mira:  "\"So I know whether Concierge®\u00AE should call ahead before a visit.\"",
        type:  "choice",
        options: [
          { label: "Friendly immediately", value: "friendly",  emoji: "\u{1F604}" },
          { label: "Warms up slowly",      value: "slow_warm", emoji: "\u{1F321}\uFE0F" },
          { label: "Shy but curious",      value: "shy",       emoji: "\u{1FAE3}" },
          { label: "Protective",           value: "protective",emoji: "\u{1F6E1}\uFE0F" },
        ]
      },
      {
        key:   "lives_with_children",
        pts:   5,
        text:  "Does {name} live with or spend time with children?",
        mira:  "\"This shapes which products and services I recommend.\"",
        type:  "choice",
        options: [
          { label: "Yes, regularly",   value: "yes",       emoji: "\u{1F476}" },
          { label: "Occasionally",     value: "sometimes", emoji: "\u{1F388}" },
          { label: "No",               value: "no",        emoji: "\u{1F6AB}" },
        ]
      },
      {
        key:   "lives_with_other_pets",
        pts:   5,
        text:  "Are there other pets in {name}'s home?",
        mira:  "\"A multi-pet home changes what I recommend \u2014 I need to think about the whole pack.\"",
        type:  "choice",
        options: [
          { label: "Other dogs",    value: "dogs",  emoji: "\u{1F415}" },
          { label: "Cats",          value: "cats",  emoji: "\u{1F431}" },
          { label: "Both",          value: "both",  emoji: "\u{1F43E}" },
          { label: "Only child",    value: "none",  emoji: "\u{1F451}" },
        ]
      },
      {
        key:   "attachment_style",
        pts:   10,
        text:  "Is {name} your shadow \u2014 always by your side?",
        mira:  "\"Velcro dogs need different care than independent ones. I want to know {name}'s attachment style.\"",
        type:  "choice",
        options: [
          { label: "Total velcro dog",    value: "velcro",      emoji: "\u{1F9F2}" },
          { label: "Loves company",       value: "social",      emoji: "\u{1F49E}" },
          { label: "Independent",         value: "independent", emoji: "\u{1F5FA}\uFE0F" },
          { label: "Depends on mood",     value: "mixed",       emoji: "\u{1F3AD}" },
        ]
      },
      {
        key:   "separation_anxiety",
        pts:   10,
        text:  "How does {name} handle being alone?",
        mira:  "\"Separation anxiety is something I take seriously \u2014 and track carefully.\"",
        type:  "choice",
        options: [
          { label: "Fine \u2014 very calm",     value: "calm",    emoji: "\u{1F60C}" },
          { label: "A little anxious",     value: "mild",    emoji: "\u{1F61F}" },
          { label: "Very anxious",         value: "severe",  emoji: "\u{1F630}" },
          { label: "Hasn't been tested",   value: "unknown", emoji: "\u{1F937}" },
        ]
      },
    ]
  },
  {
    id:    "routine",
    label: "Rhythm & Routine",
    emoji: "\u23F0",
    color: "#1ABC9C",
    miraIntro: "Every dog has a rhythm. Tell me about {name}'s daily life.",
    questions: [
      {
        key:   "active_time",
        pts:   10,
        text:  "When is {name} most active?",
        mira:  "\"I schedule reminders and Concierge®\u00AE check-ins around your dog's natural rhythm.\"",
        type:  "choice",
        options: [
          { label: "Early morning",   value: "early_morning", emoji: "\u{1F305}" },
          { label: "Morning",         value: "morning",       emoji: "\u2600\uFE0F" },
          { label: "Evening",         value: "evening",       emoji: "\u{1F306}" },
          { label: "Night owl",       value: "night",         emoji: "\u{1F319}" },
        ]
      },
      {
        key:   "walk_frequency",
        pts:   10,
        text:  "How many walks does {name} get per day?",
        mira:  "\"This tells me if {name} needs more enrichment or is well-exercised.\"",
        type:  "choice",
        options: [
          { label: "1 walk",   value: "one",   emoji: "\u{1F9B6}" },
          { label: "2 walks",  value: "two",   emoji: "\u{1F9B6}\u{1F9B6}" },
          { label: "3+ walks", value: "three", emoji: "\u{1F3C3}" },
          { label: "Free roam / garden", value: "free", emoji: "\u{1F33F}" },
        ]
      },
      {
        key:   "grooming_frequency",
        pts:   5,
        text:  "How often does {name} get groomed?",
        mira:  "\"So I know when to remind you \u2014 and which grooming products fit.\"",
        type:  "choice",
        options: [
          { label: "Weekly",         value: "weekly",    emoji: "\u2702\uFE0F" },
          { label: "Monthly",        value: "monthly",   emoji: "\u{1F4C5}" },
          { label: "Every 2 months", value: "bimonthly", emoji: "\u{1F5D3}\uFE0F" },
          { label: "Rarely",         value: "rarely",    emoji: "\u{1F937}" },
        ]
      },
      {
        key:   "sleep_location",
        pts:   5,
        text:  "Where does {name} sleep?",
        mira:  "\"Even this tells me something about your bond with {name}.\"",
        type:  "choice",
        options: [
          { label: "On the bed with me",   value: "bed",   emoji: "\u{1F6CF}\uFE0F" },
          { label: "Own dog bed",          value: "dogbed",emoji: "\u{1FAB9}" },
          { label: "Crate",                value: "crate", emoji: "\u{1F4E6}" },
          { label: "Varies",               value: "varies",emoji: "\u{1F3B2}" },
        ]
      },
      {
        key:   "feeding_schedule",
        pts:   5,
        text:  "How many meals a day does {name} eat?",
        mira:  "\"Feeding schedule matters for digestion, weight, and treat timing.\"",
        type:  "choice",
        options: [
          { label: "Once a day",    value: "once",        emoji: "1\uFE0F\u20E3" },
          { label: "Twice a day",   value: "twice",       emoji: "2\uFE0F\u20E3" },
          { label: "Three times",   value: "three_times", emoji: "3\uFE0F\u20E3" },
          { label: "Free feeding",  value: "free",        emoji: "\u267E\uFE0F" },
        ]
      },
      {
        key:   "vet_visit_frequency",
        pts:   10,
        text:  "How often does {name} visit the vet?",
        mira:  "\"I'll send reminders and track their health schedule so nothing gets missed.\"",
        type:  "choice",
        options: [
          { label: "Every 6 months",  value: "biannual", emoji: "\u{1F4CB}" },
          { label: "Once a year",     value: "annual",   emoji: "\u{1F3E5}" },
          { label: "Only when sick",  value: "as_needed",emoji: "\u{1F912}" },
          { label: "More frequently", value: "frequent", emoji: "\u{1F489}" },
        ]
      },
      {
        key:   "car_comfort",
        pts:   5,
        text:  "How is {name} in the car?",
        mira:  "\"Essential for travel recommendations \u2014 and Concierge®\u00AE transport bookings.\"",
        type:  "choice",
        options: [
          { label: "Loves it",         value: "loves",    emoji: "\u{1F697}" },
          { label: "Fine with it",     value: "fine",     emoji: "\u{1F610}" },
          { label: "Anxious",          value: "anxious",  emoji: "\u{1F61F}" },
          { label: "Gets car sick",    value: "carsick",  emoji: "\u{1F922}" },
        ]
      },
    ]
  },
  {
    id:    "home",
    label: "Home Comforts",
    emoji: "\u{1F3E0}",
    color: "#E76F51",
    miraIntro: "Home is where {name}'s soul is. Let me understand their safe space.",
    questions: [
      {
        key:   "home_type",
        pts:   5,
        text:  "What kind of home does {name} live in?",
        mira:  "\"Apartment dogs and garden dogs have very different needs \u2014 I want to tailor everything.\"",
        type:  "choice",
        options: [
          { label: "Apartment",       value: "apartment", emoji: "\u{1F3E2}" },
          { label: "House with garden",value: "house",    emoji: "\u{1F3E1}" },
          { label: "Villa / large home",value: "villa",   emoji: "\u{1F3F0}" },
          { label: "Often moves",     value: "nomadic",   emoji: "\u{1F5FA}\uFE0F" },
        ]
      },
      {
        key:   "city",
        pts:   5,
        text:  "Which city does {name} live in?",
        mira:  "\"I use this for NearMe searches, local vets, groomers, and events.\"",
        type:  "choice",
        required: true,
        options: [
          { label: "Mumbai",     value: "mumbai",    emoji: "\u{1F30A}" },
          { label: "Delhi",      value: "delhi",     emoji: "\u{1F3DB}\uFE0F" },
          { label: "Bangalore",  value: "bangalore", emoji: "\u{1F33F}" },
          { label: "Goa",        value: "goa",       emoji: "\u{1F334}" },
          { label: "Other city", value: "other",     emoji: "\u{1F4CD}" },
        ]
      },
      {
        key:   "fears",
        pts:   10,
        text:  "Does {name} have any fears?",
        mira:  "\"So I never recommend something that could frighten {name}. This is important to me.\"",
        type:  "choice",
        options: [
          { label: "Thunder / loud noises", value: "thunder",   emoji: "\u26C8\uFE0F" },
          { label: "Fireworks",             value: "fireworks", emoji: "\u{1F386}" },
          { label: "Strangers",             value: "strangers", emoji: "\u{1F465}" },
          { label: "No known fears",        value: "none",      emoji: "\u{1F4AA}" },
        ]
      },
      {
        key:   "favourite_toy",
        pts:   5,
        text:  "What's {name}'s favourite type of toy?",
        mira:  "\"For Play recommendations \u2014 and surprise gifts from Concierge®\u00AE.\"",
        type:  "choice",
        options: [
          { label: "Squeaky toys",   value: "squeaky",    emoji: "\u{1F423}" },
          { label: "Tug ropes",      value: "tug",        emoji: "\u{1FAA2}" },
          { label: "Puzzle feeders", value: "puzzle",     emoji: "\u{1F9E9}" },
          { label: "Balls",          value: "ball",       emoji: "\u26BD" },
        ]
      },
      {
        key:   "indoor_outdoor",
        pts:   5,
        text:  "Is {name} more of an indoor or outdoor dog?",
        mira:  "\"This shapes my recommendations for their whole lifestyle.\"",
        type:  "choice",
        options: [
          { label: "Mostly indoors",      value: "indoor",  emoji: "\u{1F6CB}\uFE0F" },
          { label: "Loves the outdoors",  value: "outdoor", emoji: "\u{1F332}" },
          { label: "Both equally",        value: "both",    emoji: "\u{1F504}" },
        ]
      },
    ]
  },
  {
    id:    "travel",
    label: "Travel Style",
    emoji: "\u2708\uFE0F",
    color: "#3498DB",
    miraIntro: "Does {name} see the world with you? Let's find out.",
    questions: [
      {
        key:   "travel_frequency",
        pts:   10,
        text:  "How often does {name} travel with you?",
        mira:  "\"I'll find pet-friendly hotels, caf\u00E9s, and destinations that actually welcome {name}.\"",
        type:  "choice",
        options: [
          { label: "Often \u2014 every trip",  value: "always",    emoji: "\u2708\uFE0F" },
          { label: "Short trips only",    value: "sometimes", emoji: "\u{1F697}" },
          { label: "Rarely",              value: "rarely",    emoji: "\u{1F3E0}" },
          { label: "Never \u2014 stays home",  value: "never",     emoji: "\u{1F6CB}\uFE0F" },
        ]
      },
      {
        key:   "travel_style",
        pts:   10,
        text:  "What kind of trips do you take with {name}?",
        mira:  "\"Beach dog or mountain dog? City explorer or nature lover? I want to know.\"",
        type:  "choice",
        options: [
          { label: "Beach / resort",   value: "beach",    emoji: "\u{1F3D6}\uFE0F" },
          { label: "Mountains / hills",value: "mountains",emoji: "\u26F0\uFE0F" },
          { label: "City breaks",      value: "city",     emoji: "\u{1F3D9}\uFE0F" },
          { label: "Countryside",      value: "nature",   emoji: "\u{1F33E}" },
        ]
      },
      {
        key:   "passport",
        pts:   5,
        text:  "Does {name} have a pet passport?",
        mira:  "\"International travel needs paperwork \u2014 I can help you stay organised.\"",
        type:  "choice",
        options: [
          { label: "Yes",          value: "yes",     emoji: "\u{1F4D8}" },
          { label: "No",           value: "no",      emoji: "\u2717" },
          { label: "In progress",  value: "pending", emoji: "\u{1F504}" },
        ]
      },
      {
        key:   "transport_preference",
        pts:   5,
        text:  "How does {name} usually travel?",
        mira:  "\"So I recommend the right carriers, calming aids, and Concierge®\u00AE transport options.\"",
        type:  "choice",
        options: [
          { label: "Car",       value: "car",       emoji: "\u{1F697}" },
          { label: "Train",     value: "train",     emoji: "\u{1F682}" },
          { label: "Flight",    value: "flight",    emoji: "\u2708\uFE0F" },
          { label: "Multiple",  value: "multiple",  emoji: "\u{1F5FA}\uFE0F" },
        ]
      },
    ]
  },
  {
    id:    "food",
    label: "Taste & Treat",
    emoji: "\u{1F356}",
    color: "#E8A045",
    miraIntro: "This chapter is critical. What {name} eats \u2014 and can't eat \u2014 is the most important thing I need to know.",
    questions: [
      {
        key:   "food_allergies",
        pts:   15,
        required: true,
        text:  "Does {name} have any food allergies?",
        mira:  "\"This is non-negotiable. I will NEVER suggest anything with {name}'s allergens. Ever.\"",
        type:  "choice",
        options: [
          { label: "Chicken",                value: "chicken", emoji: "\u{1F6AB}\u{1F357}" },
          { label: "Beef",                   value: "beef",    emoji: "\u{1F6AB}\u{1F969}" },
          { label: "Grain / Gluten",         value: "grain",   emoji: "\u{1F6AB}\u{1F33E}" },
          { label: "None that I know of",    value: "none",    emoji: "\u2713" },
        ]
      },
      {
        key:   "diet_type",
        pts:   10,
        text:  "What kind of diet is {name} on?",
        mira:  "\"So every food recommendation fits perfectly.\"",
        type:  "choice",
        options: [
          { label: "Kibble (dry food)",     value: "kibble",  emoji: "\u{1F7E4}" },
          { label: "Wet / canned food",     value: "wet",     emoji: "\u{1F96B}" },
          { label: "Raw / BARF diet",       value: "raw",     emoji: "\u{1F969}" },
          { label: "Home cooked meals",     value: "homemade",emoji: "\u{1F373}" },
        ]
      },
      {
        key:   "favourite_treat",
        pts:   10,
        text:  "What does {name} go absolutely crazy for?",
        mira:  "\"This is for birthday cakes, rewards, and surprise gifts from Concierge®\u00AE.\"",
        type:  "choice",
        options: [
          { label: "Peanut butter",        value: "peanut_butter", emoji: "\u{1F95C}" },
          { label: "Cheese",               value: "cheese",        emoji: "\u{1F9C0}" },
          { label: "Meat treats",          value: "meat",          emoji: "\u{1F969}" },
          { label: "Fruits / vegetables",  value: "fruit_veg",     emoji: "\u{1F955}" },
        ]
      },
      {
        key:   "special_diet",
        pts:   10,
        text:  "Is {name} on any special diet for health reasons?",
        mira:  "\"Kidney diet, low-fat, diabetic \u2014 these change everything I recommend.\"",
        type:  "choice",
        options: [
          { label: "Grain-free",          value: "grain_free",  emoji: "\u{1F33E}" },
          { label: "Low fat / cardiac",   value: "low_fat",     emoji: "\u2764\uFE0F" },
          { label: "Kidney / renal",      value: "renal",       emoji: "\u{1F48A}" },
          { label: "No special diet",     value: "none",        emoji: "\u2713" },
        ]
      },
      {
        key:   "treat_frequency",
        pts:   5,
        text:  "How often does {name} get treats?",
        mira:  "\"I won't overwhelm you with treat recommendations if {name} is treat-limited.\"",
        type:  "choice",
        options: [
          { label: "Every day",      value: "daily",     emoji: "\u{1F381}" },
          { label: "A few times a week", value: "weekly",emoji: "\u{1F4C5}" },
          { label: "Rarely",         value: "rarely",    emoji: "\u{1F90F}" },
          { label: "Only for training", value: "training",emoji: "\u{1F393}" },
        ]
      },
      {
        key:   "water_drinker",
        pts:   5,
        text:  "Is {name} a good water drinker?",
        mira:  "\"Hydration matters especially for seniors and dogs with health conditions.\"",
        type:  "choice",
        options: [
          { label: "Drinks plenty",    value: "good",     emoji: "\u{1F4A7}" },
          { label: "Average",          value: "average",  emoji: "\u{1FAD7}" },
          { label: "Needs encouragement", value: "low",   emoji: "\u{1F605}" },
        ]
      },
    ]
  },
  {
    id:    "training",
    label: "Training & Behaviour",
    emoji: "\u{1F393}",
    color: "#7C3AED",
    miraIntro: "What has {name} learned? What are they still working on? This shapes the whole Learn pillar.",
    questions: [
      {
        key:   "training_level",
        pts:   10,
        text:  "How trained is {name}?",
        mira:  "\"So I know whether to recommend beginner classes or advanced enrichment.\"",
        type:  "choice",
        options: [
          { label: "None yet",          value: "none",     emoji: "\u{1F331}" },
          { label: "Basic (sit, stay)", value: "basic",    emoji: "\u{1F4DA}" },
          { label: "Intermediate",      value: "intermediate",emoji:"\u{1F3AF}"},
          { label: "Advanced",          value: "advanced", emoji: "\u{1F3C6}" },
        ]
      },
      {
        key:   "training_method",
        pts:   10,
        text:  "What training method works best for {name}?",
        mira:  "\"Every trainer Concierge®\u00AE recommends will use your preferred method.\"",
        type:  "choice",
        options: [
          { label: "Positive reinforcement", value: "positive",  emoji: "\u{1F31F}" },
          { label: "Clicker training",       value: "clicker",   emoji: "\u{1F514}" },
          { label: "Treat-based",            value: "treats",    emoji: "\u{1F9B4}" },
          { label: "Not sure yet",           value: "unknown",   emoji: "\u{1F937}" },
        ]
      },
      {
        key:   "behavioural_challenges",
        pts:   10,
        text:  "Does {name} have any behavioural challenges?",
        mira:  "\"There's no judgment here \u2014 just information so I can help.\"",
        type:  "choice",
        options: [
          { label: "Barking",        value: "barking",  emoji: "\u{1F50A}" },
          { label: "Pulling on lead",value: "pulling",  emoji: "\u{1F9AE}" },
          { label: "Jumping up",     value: "jumping",  emoji: "\u2B06\uFE0F" },
          { label: "None really",    value: "none",     emoji: "\u{1F607}" },
        ]
      },
      {
        key:   "commands_known",
        pts:   10,
        text:  "Which commands does {name} know reliably?",
        mira:  "\"This tells me exactly where {name} is in their training journey.\"",
        type:  "choice",
        options: [
          { label: "Sit & Stay",              value: "basic",    emoji: "\u{1F64F}" },
          { label: "Recall (comes when called)", value: "recall",emoji: "\u{1F4E3}" },
          { label: "5+ commands",             value: "many",     emoji: "\u{1F393}" },
          { label: "Still learning",          value: "learning", emoji: "\u{1F331}" },
        ]
      },
      {
        key:   "grooming_comfort",
        pts:   5,
        text:  "How does {name} feel about being groomed?",
        mira:  "\"Anxious groomers need calm, patient handlers \u2014 I'll always flag this.\"",
        type:  "choice",
        options: [
          { label: "Loves it",         value: "loves",   emoji: "\u{1F60D}" },
          { label: "Tolerates it",     value: "tolerates",emoji:"\u{1F610}"},
          { label: "Anxious",          value: "anxious", emoji: "\u{1F61F}" },
          { label: "Needs desensitising", value: "needs_work",emoji:"\u{1F3AF}"},
        ]
      },
      {
        key:   "vet_comfort",
        pts:   5,
        text:  "How is {name} at the vet?",
        mira:  "\"Vet-anxious dogs need special handling. I'll make sure every vet Concierge®\u00AE recommends knows.\"",
        type:  "choice",
        options: [
          { label: "Calm and cooperative", value: "calm",    emoji: "\u{1F60C}" },
          { label: "A little nervous",     value: "nervous", emoji: "\u{1F61F}" },
          { label: "Very anxious",         value: "anxious", emoji: "\u{1F630}" },
          { label: "Needs sedation",       value: "sedation",emoji: "\u{1F48A}" },
        ]
      },
    ]
  },
  {
    id:    "horizon",
    label: "Long Horizon",
    emoji: "\u{1F305}",
    color: "#C9973A",
    miraIntro: "Last chapter. These questions help me think about {name}'s future \u2014 not just today.",
    questions: [
      {
        key:   "birthday_quarter",
        pts:   15,
        text:  "When is {name}'s birthday?",
        mira:  "\"I'll remind you 7 days before with cake ideas {name} can actually eat. I'll never forget it.\"",
        type:  "choice",
        options: [
          { label: "January \u2013 March",    value: "q1", emoji: "\u2744\uFE0F" },
          { label: "April \u2013 June",       value: "q2", emoji: "\u{1F338}" },
          { label: "July \u2013 September",   value: "q3", emoji: "\u2600\uFE0F" },
          { label: "October \u2013 December", value: "q4", emoji: "\u{1F342}" },
        ]
      },
      {
        key:   "health_conditions",
        pts:   15,
        required: true,
        text:  "Does {name} have any ongoing health conditions?",
        mira:  "\"This is the most important health question. I'll make sure every recommendation respects {name}'s condition.\"",
        type:  "choice",
        options: [
          { label: "Joint / arthritis",   value: "joints",   emoji: "\u{1F9B4}" },
          { label: "Skin conditions",     value: "skin",     emoji: "\u{1FA79}" },
          { label: "Heart / organ",       value: "cardiac",  emoji: "\u2764\uFE0F" },
          { label: "Healthy \u2014 no issues", value: "healthy",  emoji: "\u{1F4AA}" },
        ]
      },
      {
        key:   "insurance",
        pts:   5,
        text:  "Does {name} have pet insurance?",
        mira:  "\"If not, I can connect you with Concierge®\u00AE to explore options.\"",
        type:  "choice",
        options: [
          { label: "Yes",              value: "yes",     emoji: "\u2713" },
          { label: "No",               value: "no",      emoji: "\u2717" },
          { label: "Considering it",   value: "pending", emoji: "\u{1F914}" },
        ]
      },
      {
        key:   "adoption_story",
        pts:   5,
        text:  "How did {name} come into your life?",
        mira:  "\"Every story matters. Rescues often need different care \u2014 I want to know {name}'s beginning.\"",
        type:  "choice",
        options: [
          { label: "Adopted / rescued", value: "adopted",  emoji: "\u{1F43E}" },
          { label: "Breeder",           value: "breeder",  emoji: "\u{1F3E0}" },
          { label: "Friend / family",   value: "gifted",   emoji: "\u{1F381}" },
          { label: "Stray I found",     value: "stray",    emoji: "\u{1F31F}" },
        ]
      },
      {
        key:   "goals",
        pts:   10,
        text:  "What's your biggest goal for {name} this year?",
        mira:  "\"This tells me what to prioritise \u2014 health, happiness, training, or adventures.\"",
        type:  "choice",
        options: [
          { label: "Better health",      value: "health",    emoji: "\u{1F4AA}" },
          { label: "More socialisation", value: "social",    emoji: "\u{1F415}" },
          { label: "Travel together",    value: "travel",    emoji: "\u2708\uFE0F" },
          { label: "More joy and play",  value: "happiness", emoji: "\u{1F3BE}" },
        ]
      },
      {
        key:         "life_vision",
        pts:         8,
        text:        "In one sentence, what kind of life do you want for {name}?",
        mira:        "\"Beautiful. Everything I do for {name} will be guided by this.\"",
        type:        "text",
        placeholder: "e.g. A life full of adventure, love and salmon treats\u2026",
      },
    ]
  },
];

// ── Flatten all questions ──────────────────────────────────────────────────
const ALL_QUESTIONS = [];
CHAPTERS.forEach((ch, ci) => {
  ch.questions.forEach((q, qi) => {
    ALL_QUESTIONS.push({ ...q, chapterIdx: ci, chapterLabel: ch.label, chapterEmoji: ch.emoji, chapterColor: ch.color, chapterMiraIntro: ch.miraIntro });
  });
});
const TOTAL_PTS = ALL_QUESTIONS.reduce((s, q) => s + q.pts, 0);

// ── Glass orb CSS ─────────────────────────────────────────────────────────
const ORB_CSS = `
  .mira-orb {
    border-radius: 50%;
    background: radial-gradient(circle at 35% 35%,rgba(255,255,255,0.55) 0%,rgba(200,150,255,0.35) 35%,rgba(155,89,182,0.6) 65%,rgba(100,40,140,0.8) 100%);
    box-shadow: inset 0 -3px 8px rgba(0,0,0,0.25),inset 0 2px 4px rgba(255,255,255,0.6),0 4px 24px rgba(155,89,182,0.6);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.95); position: relative; flex-shrink: 0;
  }
  .mira-orb::after {
    content: ''; position: absolute; top: 22%; left: 26%;
    width: 28%; height: 18%; background: rgba(255,255,255,0.7);
    border-radius: 50%; transform: rotate(-30deg);
  }
  .soul-opt {
    background: rgba(255,255,255,0.06);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 14px; padding: 14px 16px;
    cursor: pointer; transition: all 0.2s;
    color: #F5F0E8; font-family: 'DM Sans', sans-serif;
    text-align: left; width: 100%;
    display: flex; align-items: center; gap: 12px;
  }
  .soul-opt:hover { background: rgba(155,89,182,0.15); border-color: rgba(155,89,182,0.4); }
  .soul-opt.sel { background: rgba(155,89,182,0.25); border-color: #9B59B6; }
  .soul-opt .opt-check {
    width: 20px; height: 20px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.2s;
  }
  .soul-opt.sel .opt-check {
    background: #9B59B6; border-color: #9B59B6;
  }
  .pts-pop {
    position: fixed; top: 30%; left: 50%;
    transform: translateX(-50%);
    background: rgba(201,151,58,0.95);
    color: #0A0A0F; font-weight: 700; font-size: 18px;
    padding: 8px 20px; border-radius: 999px;
    animation: ptsAnim 1.2s ease forwards;
    pointer-events: none; z-index: 9999;
  }
  @keyframes ptsAnim {
    0%   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
    60%  { opacity:1; transform:translateX(-50%) translateY(-30px) scale(1.1); }
    100% { opacity:0; transform:translateX(-50%) translateY(-60px) scale(0.9); }
  }
  @keyframes orbPulse {
    0%,100% { box-shadow:inset 0 -3px 8px rgba(0,0,0,0.25),inset 0 2px 4px rgba(255,255,255,0.6),0 4px 24px rgba(155,89,182,0.6); }
    50%     { box-shadow:inset 0 -3px 8px rgba(0,0,0,0.25),inset 0 2px 4px rgba(255,255,255,0.6),0 8px 48px rgba(155,89,182,0.9); }
  }
  @keyframes slideIn {
    from { opacity:0; transform:translateX(24px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(16px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes celebPop {
    0%  { transform:scale(0.8); opacity:0; }
    60% { transform:scale(1.05); }
    100%{ transform:scale(1); opacity:1; }
  }
`;

export default function PetSoulOnboarding() {
  const navigate     = useNavigate();
  const [params]     = useSearchParams();
  const { token, user } = useAuth();

  const [screen,       setScreen]       = useState('intro');    // intro | pet-picker | question | celebration | pet-complete
  const [qIdx,         setQIdx]         = useState(0);
  const [selected,     setSelected]     = useState(null);
  const [score,        setScore]        = useState(0);
  const [answers,      setAnswers]      = useState({});
  const [saving,       setSaving]       = useState(false);
  const [showPtsPop,   setShowPtsPop]   = useState(false);
  const [ptsPop,       setPtsPop]       = useState(0);
  const [animating,    setAnimating]    = useState(false);
  const [pets,         setPets]         = useState([]);
  const [currentPet,   setCurrentPet]   = useState(null);
  const [petsLoaded,   setPetsLoaded]   = useState(false);
  const [textAnswer,   setTextAnswer]   = useState('');
  const [isResuming,   setIsResuming]   = useState(false); // Fix 1: resume banner
  const [archetype,    setArchetype]    = useState(null);  // Fix 3: soul archetype

  const startChapterRef = useRef(null);

  // ── Phase 2: Per-pet helper — does this pet already have its soul profile? ──
  const isPetCompleted = (pet) => {
    const a = pet?.doggy_soul_answers || {};
    const meaningful = Object.values(a).filter(v =>
      v && v !== '' && v !== 'None' &&
      !(Array.isArray(v) && v.length === 0) &&
      !(typeof v === 'object' && v.skipped)
    );
    return meaningful.length >= 5;
  };

  // ── Load pets on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/pets/my-pets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        const petList = data.pets || data || [];
        setPets(petList);
        setPetsLoaded(true);

        // Use pet from URL param if present
        const paramPetId = params.get('pet_id') || params.get('pet');

        // ── PHASE 2: Multi-pet families see the picker first ──
        // Each dog deserves their own Soul Profile. If the user has more
        // than one pet AND no specific pet was chosen via URL, route them
        // through the pet picker so they explicitly select one dog at a time.
        if (petList.length > 1 && !paramPetId) {
          setScreen('pet-picker');
          return;
        }

        // Single-pet family OR a specific pet was requested via URL — pick it.
        const pet = paramPetId
          ? petList.find(p => p.id === paramPetId) || petList[0]
          : petList[0];
        setCurrentPet(pet);
      })
      .catch(() => { setPetsLoaded(true); });
  }, [token, params]);

  // ── PHASE 2: helper to load a specific pet and start the quiz ──
  const loadPetForQuiz = (pet) => {
    if (!pet) return;
    // Reset quiz state so we don't carry over the previous dog's progress
    setCurrentPet(pet);
    setAnswers({});
    setScore(0);
    setQIdx(0);
    setSelected(null);
    setTextAnswer('');
    setIsResuming(false);
    setArchetype(null);
    setScreen('intro');
  };

  // ── No pets → redirect to /join ────────────────────────────────────────
  useEffect(() => {
    if (petsLoaded && pets.length === 0 && token) {
      const timer = setTimeout(() => {
        if (pets.length === 0) navigate('/join');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [pets, petsLoaded, token, navigate]);

  // ── Fix 1: Pre-populate answers/score from existing pet data, resume from last answered ─
  useEffect(() => {
    if (!currentPet) return;
    const existing = currentPet.doggy_soul_answers || {};
    const keys = Object.keys(existing).filter(k => existing[k]);
    if (keys.length === 0) return;

    // Restore answers and recompute score
    setAnswers(existing);
    const existingScore = ALL_QUESTIONS.reduce(
      (sum, aq) => (existing[aq.key] ? sum + aq.pts : sum), 0
    );
    setScore(existingScore);

    // Resume point: first unanswered question in order
    const resumeIdx = ALL_QUESTIONS.findIndex(aq => !existing[aq.key]);
    const targetIdx = resumeIdx === -1 ? ALL_QUESTIONS.length - 1 : resumeIdx;
    if (targetIdx > 0) {
      setQIdx(targetIdx);
      setIsResuming(true);
    }
  }, [currentPet]); // eslint-disable-line

  const petName = currentPet?.name || 'your dog';
  const petPhoto = currentPet?.photo_url || currentPet?.photo || null;
  const q = ALL_QUESTIONS[qIdx];
  const pct = Math.round((score / TOTAL_PTS) * 100);

  // Replace {name} placeholder
  const txt = (s) => s?.replace(/\{name\}/g, petName) || '';

  // ── Save answer to backend (FIX: question_id not question) ─────────────
  const saveAnswer = async (key, value, chapterLabel) => {
    if (!currentPet?.id || !token) return;
    try {
      await fetch(`${API_URL}/api/pet-soul/profile/${currentPet.id}/answer`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          question_id: key,
          answer:      value,
        }),
      });
    } catch {
      // Silent — don't break the UX for a save failure
    }
  };

  // ── Select an option ───────────────────────────────────────────────────
  const handleSelect = (opt) => {
    if (animating) return;
    if (selected?.value === opt.value) return;
    setSelected(opt);
  };

  // ── Next question ──────────────────────────────────────────────────────
  const handleNext = async () => {
    const isTextQ = q.type === 'text';
    const canProceed = isTextQ ? textAnswer.trim().length > 0 : !!selected;
    if (!canProceed || animating) return;
    setAnimating(true);
    setSaving(true);

    const answerValue = isTextQ ? textAnswer.trim() : selected.value;

    // Save to backend
    await saveAnswer(q.key, answerValue, q.chapterLabel);

    // Update score
    const newScore = score + q.pts;
    setScore(newScore);
    setAnswers(prev => ({ ...prev, [q.key]: answerValue }));

    // Show pts popup
    setPtsPop(q.pts);
    setShowPtsPop(true);
    setTimeout(() => setShowPtsPop(false), 1200);

    setSaving(false);

    if (qIdx + 1 >= ALL_QUESTIONS.length) {
      // Celebration! Infer archetype in background
      if (currentPet?.id) {
        fetch(`${API_URL}/api/pets/${currentPet.id}/infer-archetype`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data?.archetype_label) setArchetype(data.archetype_label); })
          .catch(() => {});
      }
      // ── PHASE 2: Multi-pet families see the "next dog" prompt instead ──
      const stillPending = (pets || []).filter(p => {
        if ((p.id || p._id) === currentPet?.id) return false;
        return !isPetCompleted(p);
      });
      const screenAfter = (pets.length > 1 && stillPending.length > 0) ? 'pet-complete' : 'celebration';
      setTimeout(() => {
        // Refresh pet list first so isPetCompleted reflects the just-saved profile
        if (pets.length > 1 && token) {
          fetch(`${API_URL}/api/pets/my-pets`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(r => r.json())
            .then(data => {
              const fresh = data.pets || data || [];
              setPets(fresh);
            })
            .catch(() => {});
        }
        setScreen(screenAfter);
        setAnimating(false);
      }, 400);
      return;
    }

    // Slide to next question
    setTimeout(() => {
      setQIdx(prev => prev + 1);
      setSelected(null);
      setTextAnswer('');
      setAnimating(false);
    }, 350);
  };

  // ── Skip to next chapter ───────────────────────────────────────────────
  const handleSkipChapter = () => {
    const nextChapterIdx = q.chapterIdx + 1;
    const nextQIdx = ALL_QUESTIONS.findIndex(q => q.chapterIdx === nextChapterIdx);
    if (nextQIdx === -1) {
      // Last chapter — infer archetype before showing celebration
      if (currentPet?.id) {
        fetch(`${API_URL}/api/pets/${currentPet.id}/infer-archetype`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => { if (data?.archetype_label) setArchetype(data.archetype_label); })
          .catch(() => {});
      }
      // ── PHASE 2: Multi-pet families see the "next dog" prompt instead ──
      const stillPending = (pets || []).filter(p => {
        if ((p.id || p._id) === currentPet?.id) return false;
        return !isPetCompleted(p);
      });
      setScreen(pets.length > 1 && stillPending.length > 0 ? 'pet-complete' : 'celebration');
    } else {
      setQIdx(nextQIdx);
      setSelected(null);
      setTextAnswer('');
    }
  };

  // ── Back to previous question — restores saved answer ─────────────────
  const handleBack = () => {
    if (qIdx === 0) return;
    const prevQ = ALL_QUESTIONS[qIdx - 1];
    const prevAnswer = answers[prevQ.key];
    if (prevQ.type === 'text') {
      setTextAnswer(prevAnswer || '');
      setSelected(null);
    } else {
      const prevOpt = prevQ.options?.find(o => o.value === prevAnswer) || null;
      setSelected(prevOpt);
      setTextAnswer('');
    }
    setQIdx(prev => prev - 1);
  };

  // ── Soul score ring path ───────────────────────────────────────────────
  const ringPct = Math.round((score / TOTAL_PTS) * 100);
  const RING_C = 314; // 2 * PI * 50
  const ringOffset = RING_C - (RING_C * ringPct / 100);

  // ── SCREEN: PET PICKER (multi-pet families) ────────────────────────────
  if (screen === 'pet-picker') {
    const pendingPets = pets.filter(p => !isPetCompleted(p));
    const completedCount = pets.length - pendingPets.length;
    return (
      <div
        style={{
          minHeight:'100vh', background: C.night,
          display:'flex', flexDirection:'column', alignItems:'center',
          padding:'48px 20px', color:'#fff',
        }}
        data-testid="psu-pet-picker"
      >
        <div style={{ maxWidth: 460, width:'100%' }}>
          <div style={{ textAlign:'center', marginBottom: 24 }}>
            <div style={{
              width:56, height:56, borderRadius:9999,
              background:'linear-gradient(135deg,#a855f7,#7c3aed)',
              margin:'0 auto 16px', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:24,
            }}>✦</div>
            <h1 style={{ fontFamily:'Georgia,serif', fontSize:24, marginBottom:8 }}>
              Which dog first?
            </h1>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.5 }}>
              You have <b style={{ color:'#fff' }}>{pets.length} dogs</b> — Mira will build a separate Soul Profile for each one.
              {completedCount > 0 && (
                <> <span style={{ color:'#10b981' }}>{completedCount} done</span>, {pendingPets.length} to go.</>
              )}
            </p>
          </div>

          {/* Progress chips */}
          {pets.length > 1 && (
            <div style={{
              display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', marginBottom:20,
            }} data-testid="psu-progress-chips">
              {pets.map(p => {
                const done = isPetCompleted(p);
                return (
                  <span key={p.id || p._id} style={{
                    fontSize:11, padding:'4px 10px', borderRadius:9999,
                    border: done ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.15)',
                    background: done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                    color: done ? '#a7f3d0' : 'rgba(255,255,255,0.7)',
                  }}>
                    {done ? '✅' : '⏳'} {p.name}
                  </span>
                );
              })}
            </div>
          )}

          {/* Cards */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {pets.map(p => {
              const done = isPetCompleted(p);
              return (
                <button
                  key={p.id || p._id}
                  type="button"
                  disabled={done}
                  onClick={() => loadPetForQuiz(p)}
                  data-testid={`psu-pet-card-${p.id || p._id}`}
                  style={{
                    textAlign:'left', padding:'14px 16px', borderRadius:14,
                    border: done ? '2px solid rgba(16,185,129,0.4)' : '2px solid rgba(168,85,247,0.4)',
                    background:'rgba(255,255,255,0.04)',
                    color:'#fff', cursor: done ? 'not-allowed' : 'pointer',
                    opacity: done ? 0.6 : 1,
                    display:'flex', alignItems:'center', gap:14, transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!done) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={e => { if (!done) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  <div style={{
                    width:48, height:48, borderRadius:9999, overflow:'hidden',
                    background:'linear-gradient(135deg,#ec4899,#a855f7)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:24, flexShrink:0,
                    border:'2px solid rgba(255,255,255,0.15)',
                  }}>
                    {(p.photo_url || p.photo)
                      ? <img src={p.photo_url || p.photo} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <span>🐾</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:16, display:'flex', alignItems:'baseline', gap:8 }}>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</span>
                      {done && <span style={{ fontSize:11, color:'#10b981' }}>✅ Done</span>}
                    </div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2 }}>
                      {p.breed || 'Mira will figure it out'}
                    </div>
                  </div>
                  <span style={{ color:'rgba(255,255,255,0.6)', flexShrink:0 }}>{done ? '' : '→'}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => navigate('/pet-home')}
            data-testid="psu-pet-picker-skip-all"
            style={{
              display:'block', margin:'28px auto 0', background:'transparent',
              border:'none', color:'rgba(255,255,255,0.5)', fontSize:13,
              textDecoration:'underline', cursor:'pointer',
            }}
          >
            I'll do this later →
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN: PET COMPLETE (between dogs in multi-pet flow) ──────────────
  if (screen === 'pet-complete') {
    const justFinished = currentPet?.name || 'this dog';
    const stillToDo = pets.filter(p => {
      if ((p.id || p._id) === currentPet?.id) return false;
      return !isPetCompleted(p);
    });
    const nextDog = stillToDo[0];
    return (
      <div
        style={{
          minHeight:'100vh', background: C.night,
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'40px 24px', color:'#fff', textAlign:'center',
        }}
        data-testid="psu-pet-complete"
      >
        <div style={{ maxWidth: 460, width:'100%' }}>
          <div style={{
            width:80, height:80, borderRadius:9999,
            background:'linear-gradient(135deg,#34d399,#059669)',
            margin:'0 auto 20px', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:36,
          }}>✓</div>
          <h1 style={{ fontFamily:'Georgia,serif', fontSize:24, marginBottom:12 }}>
            {justFinished}'s profile is complete!
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', lineHeight:1.6, marginBottom:24 }}>
            Mira now knows {justFinished} truly. {stillToDo.length === 1
              ? "One more dog to go — "
              : `${stillToDo.length} more dogs to go — `}
            keep teaching her about your pack.
          </p>

          {/* Progress strip */}
          <div style={{
            display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', marginBottom:28,
          }} data-testid="psu-pet-complete-progress">
            {pets.map(p => {
              const done = isPetCompleted(p) || (p.id || p._id) === currentPet?.id;
              return (
                <span key={p.id || p._id} style={{
                  fontSize:11, padding:'4px 10px', borderRadius:9999,
                  border: done ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.15)',
                  background: done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                  color: done ? '#a7f3d0' : 'rgba(255,255,255,0.7)',
                }}>
                  {done ? '✅' : '⏳'} {p.name}
                </span>
              );
            })}
          </div>

          {nextDog && (
            <button
              type="button"
              onClick={() => loadPetForQuiz(nextDog)}
              data-testid="psu-next-dog-btn"
              style={{
                width:'100%', padding:'15px 18px', borderRadius:12,
                background:'linear-gradient(135deg,#ec4899,#7c3aed)',
                color:'#fff', fontWeight:700, fontSize:15,
                border:'none', cursor:'pointer',
                boxShadow:'0 8px 24px rgba(168,85,247,0.3)',
              }}
            >
              Start {nextDog.name}'s profile →
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const pid = currentPet?.id;
              navigate(pid ? `/pet-home?active_pet=${pid}` : '/pet-home');
            }}
            data-testid="psu-do-later-btn"
            style={{
              display:'block', margin:'14px auto 0', padding:'10px 18px',
              background:'transparent', border:'none',
              color:'rgba(255,255,255,0.7)', fontSize:13,
              textDecoration:'underline', cursor:'pointer',
            }}
          >
            I'll do the others later
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN: INTRO ──────────────────────────────────────────────────────
  if (screen === 'intro') {
    return (
      <div style={{
        minHeight: '100vh', background: C.night,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', textAlign: 'center',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <style>{`${FONTS}${ORB_CSS}`}</style>

        {/* Pet photo or glass orb */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          marginBottom: 28, position: 'relative',
          border: '3px solid rgba(201,151,58,0.4)',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {petPhoto ? (
            <img
              src={petPhoto}
              alt={petName}
              style={{ width:'100%', height:'100%', objectFit:'cover' }}
            />
          ) : (
            <div className="mira-orb" style={{
              width:'100%', height:'100%', fontSize:36,
              animation:'orbPulse 2s ease-in-out infinite',
            }}>
              {"\u{1F43E}"}
            </div>
          )}
        </div>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(1.8rem,5vw,3rem)',
          fontWeight: 300, lineHeight: 1.2,
          color: C.ivory, marginBottom: 16,
        }}>
          Hi. I'm Mira.<br/>
          <em style={{ color: C.amber }}>Let me meet {petName}.</em>
        </h1>

        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, maxWidth: 300, marginBottom: 32 }}>
          {ALL_QUESTIONS.length} questions across {CHAPTERS.length} chapters. Every answer unlocks a piece of {petName}'s soul — and makes me smarter about everything I recommend.
        </p>

        {/* Preview soul score ring */}
        <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 12 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
            <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" strokeLinecap="round"
              stroke="url(#introGrad)"
              strokeDasharray="314" strokeDashoffset={314 - Math.round((pct / 100) * 314)}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dashoffset 1.5s ease' }}
            />
            <defs>
              <linearGradient id="introGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9B59B6"/>
                <stop offset="100%" stopColor="#E91E8C"/>
              </linearGradient>
            </defs>
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: C.amber }} data-testid="soul-score-intro-pct">{pct}%</div>
            <div style={{ fontSize: 10, color: C.dim, letterSpacing: '0.08em' }}>SOUL SCORE</div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: C.dim, marginBottom: 32 }}>
          Watch {petName}'s score grow with every answer
        </p>

        {/* Chapter preview */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
          justifyContent: 'center', maxWidth: 320, marginBottom: 36,
        }}>
          {CHAPTERS.map(ch => (
            <div key={ch.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999, padding: '5px 12px',
              fontSize: 12, color: C.muted,
            }}>
              <span style={{ fontSize: 14 }}>{ch.emoji}</span> {ch.label}
            </div>
          ))}
        </div>

        <button
          onClick={() => setScreen('question')}
          data-testid="soul-builder-start-btn"
          style={{
            padding: '16px 56px', borderRadius: 999, border: 'none',
            background: `linear-gradient(135deg, ${C.purple}, ${C.pink})`,
            color: '#fff', fontSize: 17, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            boxShadow: '0 8px 32px rgba(155,89,182,0.4)',
            marginBottom: 16,
          }}
        >
          {isResuming ? 'Continue where you left off' : "Let's begin"}
        </button>

        {isResuming && (
          <div style={{
            background: 'rgba(155,89,182,0.15)', border: '1px solid rgba(155,89,182,0.3)',
            borderRadius: 12, padding: '10px 20px', marginBottom: 12,
            color: C.purple, fontSize: 13, fontWeight: 500,
          }}>
            Welcome back — picking up from Q{qIdx + 1} of {ALL_QUESTIONS.length}
          </div>
        )}

        <button
          onClick={() => navigate('/pet-home')}
          data-testid="soul-builder-skip-btn"
          style={{
            background: 'none', border: 'none',
            color: C.dim, fontSize: 13, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Skip for now — fill in later
        </button>
      </div>
    );
  }

  // ── SCREEN: QUESTIONS ──────────────────────────────────────────────────
  if (screen === 'question') {
    const isNewChapter = qIdx === 0 || ALL_QUESTIONS[qIdx - 1]?.chapterIdx !== q.chapterIdx;
    const chProgress = ALL_QUESTIONS.filter(aq => aq.chapterIdx < q.chapterIdx).length;
    const totalAnswered = Object.keys(answers).length;

    return (
      <div style={{
        minHeight: '100vh', background: C.night,
        display: 'flex', flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative',
      }}>
        <style>{`${FONTS}${ORB_CSS}`}</style>

        {/* Points popup */}
        {showPtsPop && (
          <div className="pts-pop">+{ptsPop} pts</div>
        )}

        {/* Header */}
        <div style={{
          padding: '14px 20px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${C.border}`,
          background: C.deep,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          {/* Chapter dots */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {CHAPTERS.map((ch, i) => {
              const done = i < q.chapterIdx;
              const active = i === q.chapterIdx;
              return (
                <div key={ch.id} style={{
                  width: active ? 24 : 10,
                  height: 10, borderRadius: 999,
                  background: done ? C.amber : active ? C.purple : 'rgba(255,255,255,0.15)',
                  transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <span style={{ fontSize: 8 }}>{ch.emoji}</span>}
                </div>
              );
            })}
          </div>

          {/* Live soul score ring */}
          <div style={{ position: 'relative', width: 52, height: 52 }}>
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
              <circle cx="26" cy="26" r="20" fill="none" strokeWidth="4" strokeLinecap="round"
                stroke="url(#hGrad)"
                strokeDasharray="126"
                strokeDashoffset={126 - (126 * ringPct / 100)}
                style={{ transform:'rotate(-90deg)', transformOrigin:'26px 26px', transition:'stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}
              />
              <defs>
                <linearGradient id="hGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={C.purple}/>
                  <stop offset="100%" stopColor={C.pink}/>
                </linearGradient>
              </defs>
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.amber }}>{ringPct}%</span>
            </div>
          </div>
        </div>

        {/* Chapter intro banner — shown on first question of each chapter */}
        {isNewChapter && (
          <div style={{
            background: `linear-gradient(135deg, rgba(155,89,182,0.15), rgba(233,30,140,0.1))`,
            borderBottom: '1px solid rgba(155,89,182,0.2)',
            padding: '14px 20px',
            display: 'flex', gap: 12, alignItems: 'center',
            animation: 'fadeUp 0.4s ease',
          }}>
            <span style={{ fontSize: 24 }}>{q.chapterEmoji}</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.purple, letterSpacing: '0.1em', marginBottom: 2 }}>
                CHAPTER {q.chapterIdx + 1} of 8
              </div>
              <div style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>
                {txt(q.chapterMiraIntro)}
              </div>
            </div>
          </div>
        )}

        {/* Mira message */}
        <div style={{
          padding: '14px 20px',
          background: 'rgba(155,89,182,0.08)',
          borderBottom: '1px solid rgba(155,89,182,0.12)',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div className="mira-orb" style={{ width: 28, height: 28, fontSize: 11 }}>{"\u2726"}</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, fontStyle: 'italic' }}>
            {txt(q.mira)}
          </div>
        </div>

        {/* Question + options */}
        <div style={{
          flex: 1, padding: '24px 20px',
          animation: animating ? 'none' : 'slideIn 0.3s ease',
        }}>
          {/* Points badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(201,151,58,0.12)',
            border: '1px solid rgba(201,151,58,0.25)',
            borderRadius: 999, padding: '4px 12px',
            fontSize: 11, fontWeight: 600, color: C.amber,
            marginBottom: 16,
          }}>
            +{q.pts} pts · Q{qIdx + 1} of {ALL_QUESTIONS.length}
          </div>

          {/* Question */}
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(1.3rem,4vw,1.8rem)',
            fontWeight: 400, lineHeight: 1.3,
            color: C.ivory, marginBottom: 24,
          }}>
            {txt(q.text)}
          </h2>

          {/* Options (choice) or Text input */}
          {q.type === 'text' ? (
            <textarea
              value={textAnswer}
              onChange={e => setTextAnswer(e.target.value)}
              placeholder={q.placeholder || 'Type your answer\u2026'}
              rows={4}
              data-testid="soul-text-input"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${textAnswer.trim() ? 'rgba(155,89,182,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14,
                padding: '14px 16px',
                color: '#F5F0E8',
                fontSize: 15,
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.6,
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map(opt => (
              <button
                key={opt.value}
                className={`soul-opt${selected?.value === opt.value ? ' sel' : ''}`}
                onClick={() => handleSelect(opt)}
                data-testid={`soul-opt-${opt.value}`}
              >
                <div className="opt-check">
                  {selected?.value === opt.value && (
                    <span style={{ color: '#fff', fontSize: 12 }}>{"\u2713"}</span>
                  )}
                </div>
                <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{opt.label}</span>
              </button>
            ))}
          </div>
          )}
        </div>

        {/* Footer buttons */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${C.border}`,
          background: C.deep,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <button
            onClick={handleNext}
            disabled={q.type === 'text' ? (!textAnswer.trim() || saving || animating) : (!selected || saving || animating)}
            data-testid="soul-builder-next-btn"
            style={{
              width: '100%', padding: '15px', borderRadius: 12, border: 'none',
              background: ((q.type === 'text' ? textAnswer.trim() : selected) && !saving)
                ? `linear-gradient(135deg, ${C.purple}, ${C.pink})`
                : 'rgba(155,89,182,0.2)',
              color: ((q.type === 'text' ? textAnswer.trim() : selected) && !saving) ? '#fff' : 'rgba(245,240,232,0.3)',
              fontSize: 15, fontWeight: 700,
              cursor: ((q.type === 'text' ? textAnswer.trim() : selected) && !saving) ? 'pointer' : 'not-allowed',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            {saving ? 'Saving\u2026' :
             qIdx === ALL_QUESTIONS.length - 1 ? 'See my Soul Profile' : 'Next \u2192'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Left group: Back + Skip chapter */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              {qIdx > 0 && (
                <button
                  onClick={handleBack}
                  data-testid="soul-builder-back-btn"
                  style={{
                    background: 'none', border: 'none',
                    color: C.muted, fontSize: 12, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {"\u2190"} Back
                </button>
              )}
              {!q.required && (
                <button
                  onClick={handleSkipChapter}
                  data-testid="soul-builder-skip-chapter-btn"
                  style={{
                    background: 'none', border: 'none',
                    color: C.dim, fontSize: 12, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Skip chapter {"\u2192"}
                </button>
              )}
              {q.required && (
                <span style={{ fontSize: 11, color: '#e67e22', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                  ★ Required
                </span>
              )}
            </div>
            {/* Save & finish later — blocked on required questions */}
            {REQUIRED_KEYS.has(q.key) ? (
              <span
                style={{
                  fontSize: 12, color: C.dim, fontFamily: "'DM Sans', sans-serif",
                  opacity: 0.5, userSelect: 'none',
                }}
                title="Please answer this required question first"
              >
                ★ Required — answer to continue
              </span>
            ) : (
              <button
                onClick={() => navigate('/pet-home')}
                data-testid="soul-builder-save-later-btn"
                style={{
                  background: 'none', border: 'none',
                  color: C.dim, fontSize: 12, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Save & finish later
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN: CELEBRATION ────────────────────────────────────────────────
  if (screen === 'celebration') {
    const finalPct = Math.round((score / TOTAL_PTS) * 100);
    const answered = Object.keys(answers).length;
    const CELEB_C = 364; // 2 * PI * 58
    const celebOffset = CELEB_C - (CELEB_C * finalPct / 100);

    // Build "Mira now knows" summary
    const knowsList = [];
    if (answers.food_allergies && answers.food_allergies !== 'none')
      knowsList.push(`Never suggests ${answers.food_allergies}`);
    if (answers.age_stage) knowsList.push(`${petName} is a ${answers.age_stage}`);
    if (answers.birthday_quarter) knowsList.push(`Birthday reminder set`);
    if (answers.health_conditions && answers.health_conditions !== 'healthy')
      knowsList.push(`Health condition noted`);
    if (answers.favourite_treat) knowsList.push(`Favourite treat: ${answers.favourite_treat.replace('_',' ')}`);
    knowsList.push(`${ALL_QUESTIONS.length - answered} more questions to reach 100%`);

    return (
      <div style={{
        minHeight: '100vh', background: C.night,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', textAlign: 'center',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <style>{`
          ${FONTS}${ORB_CSS}
          @keyframes celebPopIn { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
          @keyframes ringIn { from{stroke-dashoffset:${CELEB_C}} to{stroke-dashoffset:${celebOffset}} }
        `}</style>

        {/* Pet photo or orb */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          marginBottom: 20, position: 'relative',
          border: '3px solid rgba(201,151,58,0.5)',
          overflow: 'hidden', flexShrink: 0,
          animation: 'celebPopIn 0.5s ease',
        }}>
          {petPhoto ? (
            <img src={petPhoto} alt={petName} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          ) : (
            <div className="mira-orb" style={{
              width:'100%', height:'100%', fontSize:28,
              animation:'orbPulse 2s ease-in-out infinite',
            }}>{"\u2726"}</div>
          )}
        </div>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 'clamp(1.6rem,5vw,2.5rem)',
          fontWeight: 300, color: C.ivory,
          marginBottom: 12, lineHeight: 1.2,
        }}>
          Mira knows {petName} now.<br/>
          <em style={{ color: C.amber }}>Really knows {answers.gender === 'male' ? 'him' : answers.gender === 'female' ? 'her' : 'them'}.</em>
        </h1>

        <p style={{ fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 1.7, maxWidth: 300 }}>
          {answered} questions answered. {petName}'s soul profile is taking shape — and Mira is already building personalised recommendations.
        </p>

        {/* Final soul score ring */}
        <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 28 }}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
            <circle cx="70" cy="70" r="58" fill="none" strokeWidth="8" strokeLinecap="round"
              stroke="url(#celebGrad)"
              strokeDasharray={CELEB_C}
              strokeDashoffset={celebOffset}
              style={{
                transform:'rotate(-90deg)', transformOrigin:'70px 70px',
                transition:'stroke-dashoffset 1.8s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
            <defs>
              <linearGradient id="celebGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={C.amber}/>
                <stop offset="50%" stopColor={C.purple}/>
                <stop offset="100%" stopColor={C.pink}/>
              </linearGradient>
            </defs>
          </svg>
          <div style={{
            position:'absolute', inset:0,
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
          }}>
            <div style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:36, fontWeight:300, color:C.amber,
            }}>
              {finalPct}%
            </div>
            <div style={{ fontSize:10, color:C.dim, letterSpacing:'0.08em' }}>SOUL SCORE</div>
          </div>
        </div>

        {/* What Mira now knows */}
        <div style={{
          background: 'rgba(155,89,182,0.1)',
          border: '1px solid rgba(155,89,182,0.2)',
          borderRadius: 16, padding: '16px 20px',
          marginBottom: 28, maxWidth: 300, width: '100%',
          textAlign: 'left',
          animation: 'fadeUp 0.6s ease 0.3s both',
        }}>
          {/* Soul Archetype — shown if inferred */}
          {archetype && (
            <div style={{
              textAlign: 'center', marginBottom: 16,
              paddingBottom: 14,
              borderBottom: '1px solid rgba(155,89,182,0.2)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.amber, letterSpacing: '0.08em', marginBottom: 6 }}>
                SOUL ARCHETYPE
              </div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 22, fontWeight: 400, color: C.ivory,
              }}>
                {archetype}
              </div>
            </div>
          )}
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.purple,
            letterSpacing: '0.08em', marginBottom: 12,
          }}>
            MIRA NOW KNOWS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {knowsList.map((item, i) => (
              <div key={i} style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)', lineHeight: 1.5 }}>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <button
          onClick={() => navigate('/pet-home')}
          data-testid="soul-builder-complete-btn"
          style={{
            padding: '16px 40px', borderRadius: 999, border: 'none',
            background: `linear-gradient(135deg, ${C.amber}, ${C.amberL})`,
            color: C.night, fontSize: 16, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            marginBottom: 12, width: '100%', maxWidth: 300,
            boxShadow: `0 8px 32px rgba(201,151,58,0.3)`,
          }}
        >
          Meet my Pet Home {"\u2192"}
        </button>

        <div style={{ fontSize: 12, color: C.dim }}>
          Answer more questions anytime to reach 100%
        </div>

      </div>
    );
  }

  return null;
}
