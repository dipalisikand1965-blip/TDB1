/**
 * PetEmergencyFile.jsx
 * Auto-loaded pet medical information card
 * Shows Soul reminder questions when data is incomplete
 */

import React, { useState } from 'react';
import { 
  FileText, Share2, Download, Edit, 
  Dog, Calendar, Scale, AlertTriangle, 
  Pill, Syringe, Heart, Phone, Shield,
  ChevronDown, ChevronUp, MessageCircle,
  HelpCircle, Sparkles, ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

// Soul reminder questions for incomplete profiles
const SOUL_REMINDER_QUESTIONS = [
  {
    field: 'age',
    question: "How old is your furry friend?",
    options: ["Puppy (0-1 year)", "Young (1-3 years)", "Adult (3-7 years)", "Senior (7+ years)"],
    icon: Calendar,
    importance: "Age helps us recommend appropriate emergency care and medications"
  },
  {
    field: 'weight',
    question: "What's your pet's current weight?",
    options: ["Under 5kg", "5-10kg", "10-20kg", "20-35kg", "Over 35kg"],
    icon: Scale,
    importance: "Weight is critical for medication dosing in emergencies"
  },
  {
    field: 'allergies',
    question: "Does your pet have any known allergies?",
    options: ["Food allergies", "Medication allergies", "Environmental", "None known"],
    icon: AlertTriangle,
    importance: "Allergies must be known before any emergency treatment"
  },
  {
    field: 'medications',
    question: "Is your pet on any regular medications?",
    options: ["Yes, prescribed meds", "Supplements only", "None"],
    icon: Pill,
    importance: "Current medications affect emergency treatment options"
  },
  {
    field: 'health_conditions',
    question: "Any existing health conditions we should know?",
    options: ["Heart condition", "Joint issues", "Diabetes", "None"],
    icon: Heart,
    importance: "Pre-existing conditions guide emergency response"
  }
];

const PetEmergencyFile = ({ pet, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [showSoulQuestions, setShowSoulQuestions] = useState(false);
  
  if (!pet) {
    return (
      <section className="py-6 px-4" data-testid="pet-file-section">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-100 rounded-xl p-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700">No Pet Selected</h3>
            <p className="text-sm text-gray-500">Sign in and select a pet to see their emergency file</p>
          </div>
        </div>
      </section>
    );
  }

  // Helper to extract data from pet or doggy_soul_answers
  const soulAnswers = pet.doggy_soul_answers || {};
  
  // Calculate age from dob, birth_date, date_of_birth, or life_stage
  const calculateAge = () => {
    if (pet.age) return `${pet.age} years`;
    const birthDate = pet.dob || pet.birth_date || pet.date_of_birth;
    if (birthDate) {
      const years = Math.floor((Date.now() - new Date(birthDate)) / (365.25 * 24 * 60 * 60 * 1000));
      return `${years} years`;
    }
    // Try life_stage from soul answers
    const lifeStage = soulAnswers.life_stage;
    if (lifeStage) {
      if (lifeStage.toLowerCase().includes('puppy')) return 'Puppy (<1 year)';
      if (lifeStage.toLowerCase().includes('young')) return 'Young (1-3 years)';
      if (lifeStage.toLowerCase().includes('adult')) return 'Adult (3-7 years)';
      if (lifeStage.toLowerCase().includes('senior')) return 'Senior (7+ years)';
      return lifeStage;
    }
    return null;
  };
  
  const petAge = calculateAge();
  
  // Get weight from pet or soul answers
  const petWeight = pet.weight || soulAnswers.weight || null;
  
  // Get allergies - check both pet.allergies and soulAnswers.food_allergies
  const getAllergies = () => {
    const topLevelAllergies = pet.allergies || [];
    const soulAllergies = soulAnswers.food_allergies;
    
    if (Array.isArray(topLevelAllergies) && topLevelAllergies.length > 0) {
      return topLevelAllergies;
    }
    if (soulAllergies) {
      if (Array.isArray(soulAllergies)) return soulAllergies;
      if (typeof soulAllergies === 'string' && soulAllergies.toLowerCase() !== 'none') {
        return soulAllergies.split(',').map(a => a.trim());
      }
    }
    return [];
  };
  
  // Get medications from pet or soul answers
  const getMedications = () => {
    const topLevelMeds = pet.medications;
    const soulMeds = soulAnswers.medications;
    
    if (Array.isArray(topLevelMeds) && topLevelMeds.length > 0) {
      return topLevelMeds;
    }
    if (soulMeds && soulMeds.toLowerCase() !== 'none' && soulMeds.toLowerCase() !== 'no') {
      if (Array.isArray(soulMeds)) return soulMeds;
      return soulMeds.split(',').map(m => m.trim());
    }
    return [];
  };
  
  // Get health conditions from pet or soul answers
  const getHealthConditions = () => {
    const topLevelConditions = pet.health_conditions;
    const soulConditions = soulAnswers.health_conditions;
    
    if (Array.isArray(topLevelConditions) && topLevelConditions.length > 0) {
      return topLevelConditions;
    }
    if (soulConditions && soulConditions.toLowerCase() !== 'none' && soulConditions.toLowerCase() !== 'no') {
      if (Array.isArray(soulConditions)) return soulConditions;
      return soulConditions.split(',').map(c => c.trim());
    }
    return [];
  };
  
  const allergies = getAllergies();
  const medications = getMedications();
  const healthConditions = getHealthConditions();

  // Check for incomplete fields
  const missingFields = [];
  if (!petAge) missingFields.push('age');
  if (!petWeight) missingFields.push('weight');
  if (allergies.length === 0) missingFields.push('allergies');
  if (medications.length === 0) missingFields.push('medications');
  if (healthConditions.length === 0) missingFields.push('health_conditions');

  const pendingQuestions = SOUL_REMINDER_QUESTIONS.filter(q => missingFields.includes(q.field));
  const completionPercent = Math.round(((5 - missingFields.length) / 5) * 100);

  const emergencyInfo = [
    { icon: Dog, label: 'Breed', value: pet.breed || 'Unknown' },
    { icon: Calendar, label: 'Age', value: petAge || 'Unknown', missing: !petAge },
    { icon: Scale, label: 'Weight', value: petWeight ? `${petWeight} kg` : 'Not recorded', missing: !petWeight },
    { icon: AlertTriangle, label: 'Allergies', value: allergies.length > 0 ? allergies.join(', ') : 'None known', highlight: allergies.length > 0 },
    { icon: Pill, label: 'Medications', value: medications.length > 0 ? medications.join(', ') : 'None' },
    { icon: Heart, label: 'Conditions', value: healthConditions.length > 0 ? healthConditions.join(', ') : 'None' },
  ];

  // Get extended info from soul answers
  const getVetInfo = () => soulAnswers.vet_name || pet.regular_vet || 'Not set';
  const getVaccinations = () => {
    const vaccs = pet.vaccinations || soulAnswers.vaccination_status;
    if (Array.isArray(vaccs)) return vaccs.join(', ');
    return vaccs || 'Check records';
  };

  const extendedInfo = [
    { icon: Syringe, label: 'Vaccinations', value: getVaccinations() },
    { icon: Heart, label: 'Surgeries', value: pet.surgeries?.join(', ') || 'None' },
    { icon: Phone, label: 'Regular Vet', value: getVetInfo() },
    { icon: Phone, label: 'Emergency Contact', value: pet.emergency_contact || 'Not set' },
    { icon: Shield, label: 'Insurance', value: pet.insurance || 'None' },
  ];

  const shareViaWhatsApp = () => {
    const text = `*${pet.name}'s Emergency File*
    
Breed: ${pet.breed || 'Unknown'}
Age: ${petAge || 'Unknown'}
Weight: ${petWeight ? `${petWeight} kg` : 'Not recorded'}
Allergies: ${allergies.length > 0 ? allergies.join(', ') : 'None known'}
Medications: ${medications.length > 0 ? medications.join(', ') : 'None'}
Conditions: ${healthConditions.length > 0 ? healthConditions.join(', ') : 'None'}
Vaccinations: ${getVaccinations()}

Shared via The Doggy Company`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <section className="py-6 px-4" data-testid="pet-file-section">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 sm:p-6 border border-emerald-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {pet.photo_url ? (
                <img 
                  src={pet.photo_url} 
                  alt={pet.name} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-300"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-200 flex items-center justify-center">
                  <Dog className="w-8 h-8 text-emerald-600" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900">{pet.name}'s Emergency File</h3>
                <p className="text-sm text-emerald-700">{pet.breed} • {petAge || 'Age unknown'}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
              className="text-emerald-700"
            >
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>

          {/* Completion Status - Show if incomplete */}
          {pendingQuestions.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    Profile {completionPercent}% complete
                  </span>
                </div>
                <Badge className="bg-amber-100 text-amber-700 text-xs">
                  {pendingQuestions.length} missing
                </Badge>
              </div>
              <p className="text-xs text-amber-700 mb-2">
                Complete your pet's profile for better emergency care
              </p>
              <Button 
                size="sm" 
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100 w-full sm:w-auto"
                onClick={() => setShowSoulQuestions(!showSoulQuestions)}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {showSoulQuestions ? 'Hide' : 'Answer'} Soul Questions
              </Button>
            </div>
          )}

          {/* Soul Reminder Questions */}
          {showSoulQuestions && pendingQuestions.length > 0 && (
            <div className="mb-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Quick Soul Questions for {pet.name}
              </h4>
              
              {pendingQuestions.slice(0, 3).map((q, idx) => (
                <Card key={idx} className="p-3 border-purple-200 bg-purple-50/50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <q.icon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 mb-1">{q.question}</p>
                      <p className="text-xs text-gray-500 mb-2">{q.importance}</p>
                      <div className="flex flex-wrap gap-1">
                        {q.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              // This would trigger edit modal with pre-selected field
                              onEdit && onEdit(q.field, opt);
                            }}
                            className="px-2 py-1 text-xs bg-white border border-purple-200 rounded-full hover:bg-purple-100 hover:border-purple-400 transition-colors"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {pendingQuestions.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  +{pendingQuestions.length - 3} more questions
                </p>
              )}
              
              <Button 
                size="sm" 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={onEdit}
              >
                <Edit className="w-3 h-3 mr-2" />
                Edit Full Profile
              </Button>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {emergencyInfo.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg ${
                  item.highlight ? 'bg-red-100 border border-red-200' : 
                  item.missing ? 'bg-amber-50 border border-amber-200' : 
                  'bg-white/70'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className={`w-4 h-4 ${
                    item.highlight ? 'text-red-600' : 
                    item.missing ? 'text-amber-600' : 
                    'text-emerald-600'
                  }`} />
                  <span className="text-xs text-gray-500">{item.label}</span>
                  {item.missing && (
                    <Badge className="bg-amber-200 text-amber-700 text-[9px] px-1 py-0">!</Badge>
                  )}
                </div>
                <p className={`text-sm font-medium ${
                  item.highlight ? 'text-red-700' : 
                  item.missing ? 'text-amber-700' : 
                  'text-gray-900'
                }`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Extended Info (Collapsible) */}
          {expanded && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 pt-3 border-t border-emerald-200">
              {extendedInfo.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-white/70">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-gray-500">{item.label}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={shareViaWhatsApp}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Share with Clinic
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1 sm:flex-none border-emerald-300 text-emerald-700"
              onClick={onEdit}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Info
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PetEmergencyFile;
