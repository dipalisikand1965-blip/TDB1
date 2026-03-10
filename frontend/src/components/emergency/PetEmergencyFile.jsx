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
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestPetInfo, setGuestPetInfo] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    allergies: '',
    medications: '',
    health_conditions: ''
  });
  
  // If no pet but guest has filled info, use that
  const effectivePet = pet || (guestPetInfo.name ? {
    name: guestPetInfo.name,
    breed: guestPetInfo.breed,
    age: guestPetInfo.age,
    weight: guestPetInfo.weight,
    allergies: guestPetInfo.allergies ? guestPetInfo.allergies.split(',').map(a => a.trim()) : [],
    medications: guestPetInfo.medications ? guestPetInfo.medications.split(',').map(m => m.trim()) : [],
    health_conditions: guestPetInfo.health_conditions ? guestPetInfo.health_conditions.split(',').map(h => h.trim()) : [],
    isGuestProfile: true
  } : null);
  
  if (!effectivePet) {
    return (
      <section className="py-6 px-4" data-testid="pet-file-section">
        <div className="max-w-4xl mx-auto">
          {!showGuestForm ? (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <FileText className="w-8 h-8 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">Emergency Pet Profile</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Having your pet's info ready helps vets respond faster in emergencies
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button 
                      onClick={() => setShowGuestForm(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Create Quick Profile
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = '/login?redirect=/emergency'}
                      className="border-red-300 text-red-600"
                    >
                      Sign In for Full Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 border-2 border-red-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  Quick Emergency Profile
                </h3>
                <button 
                  onClick={() => setShowGuestForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Pet Name *</label>
                  <input
                    type="text"
                    value={guestPetInfo.name}
                    onChange={(e) => setGuestPetInfo({...guestPetInfo, name: e.target.value})}
                    placeholder="e.g., Max"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Breed</label>
                  <input
                    type="text"
                    value={guestPetInfo.breed}
                    onChange={(e) => setGuestPetInfo({...guestPetInfo, breed: e.target.value})}
                    placeholder="e.g., Labrador"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Age</label>
                  <select
                    value={guestPetInfo.age}
                    onChange={(e) => setGuestPetInfo({...guestPetInfo, age: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Select age</option>
                    <option value="Puppy (<1 year)">Puppy (&lt;1 year)</option>
                    <option value="Young (1-3 years)">Young (1-3 years)</option>
                    <option value="Adult (3-7 years)">Adult (3-7 years)</option>
                    <option value="Senior (7+ years)">Senior (7+ years)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Weight</label>
                  <select
                    value={guestPetInfo.weight}
                    onChange={(e) => setGuestPetInfo({...guestPetInfo, weight: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Select weight</option>
                    <option value="Under 5kg">Under 5kg</option>
                    <option value="5-10kg">5-10kg</option>
                    <option value="10-20kg">10-20kg</option>
                    <option value="20-35kg">20-35kg</option>
                    <option value="Over 35kg">Over 35kg</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700">Known Allergies</label>
                  <input
                    type="text"
                    value={guestPetInfo.allergies}
                    onChange={(e) => setGuestPetInfo({...guestPetInfo, allergies: e.target.value})}
                    placeholder="e.g., Chicken, Penicillin (or 'None')"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700">Current Medications</label>
                  <input
                    type="text"
                    value={guestPetInfo.medications}
                    onChange={(e) => setGuestPetInfo({...guestPetInfo, medications: e.target.value})}
                    placeholder="e.g., Insulin, Joint supplements (or 'None')"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700">Health Conditions</label>
                  <input
                    type="text"
                    value={guestPetInfo.health_conditions}
                    onChange={(e) => setGuestPetInfo({...guestPetInfo, health_conditions: e.target.value})}
                    placeholder="e.g., Heart condition, Diabetes (or 'None')"
                    className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  This info is stored locally in your browser. For permanent storage, please sign in.
                </p>
              </div>
              
              <Button 
                onClick={() => setShowGuestForm(false)}
                disabled={!guestPetInfo.name}
                className="w-full mt-4 bg-red-600 hover:bg-red-700"
              >
                Save Emergency Profile
              </Button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Helper to extract data from pet or doggy_soul_answers
  const soulAnswers = effectivePet.doggy_soul_answers || {};
  
  // Calculate age from dob, birth_date, date_of_birth, or life_stage
  const calculateAge = () => {
    if (effectivePet.age) return typeof effectivePet.age === 'string' ? effectivePet.age : `${effectivePet.age} years`;
    const birthDate = effectivePet.dob || effectivePet.birth_date || effectivePet.date_of_birth;
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
  const petWeight = effectivePet.weight || soulAnswers.weight || null;
  
  // Get allergies - check both effectivePet.allergies and soulAnswers.food_allergies
  const getAllergies = () => {
    const topLevelAllergies = effectivePet.allergies || [];
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
    const topLevelMeds = effectivePet.medications;
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
    const topLevelConditions = effectivePet.health_conditions;
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
              {effectivePet.photo_url ? (
                <img 
                  src={effectivePet.photo_url} 
                  alt={effectivePet.name} 
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-300"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-emerald-200 flex items-center justify-center">
                  <Dog className="w-8 h-8 text-emerald-600" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{effectivePet.name}'s Emergency File</h3>
                  {effectivePet.isGuestProfile && (
                    <Badge className="bg-amber-100 text-amber-700 text-xs">Guest Profile</Badge>
                  )}
                </div>
                <p className="text-sm text-emerald-700">{effectivePet.breed || 'Breed unknown'} • {petAge || 'Age unknown'}</p>
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
          {pendingQuestions.length > 0 && !effectivePet.isGuestProfile && (
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
