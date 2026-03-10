/**
 * PetEmergencyFile.jsx
 * Auto-loaded pet medical information card
 * Saves precious time in emergencies
 */

import React, { useState } from 'react';
import { 
  FileText, Share2, Download, Edit, 
  Dog, Calendar, Scale, AlertTriangle, 
  Pill, Syringe, Heart, Phone, Shield,
  ChevronDown, ChevronUp, MessageCircle
} from 'lucide-react';
import { Button } from '../ui/button';

const PetEmergencyFile = ({ pet, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  
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

  const petAge = pet.age || pet.date_of_birth 
    ? `${pet.age || Math.floor((Date.now() - new Date(pet.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))} years`
    : 'Unknown';

  const emergencyInfo = [
    { icon: Dog, label: 'Breed', value: pet.breed || 'Unknown' },
    { icon: Calendar, label: 'Age', value: petAge },
    { icon: Scale, label: 'Weight', value: pet.weight ? `${pet.weight} kg` : 'Not recorded' },
    { icon: AlertTriangle, label: 'Allergies', value: pet.allergies?.join(', ') || 'None known', highlight: pet.allergies?.length > 0 },
    { icon: Pill, label: 'Medications', value: pet.medications?.join(', ') || 'None' },
    { icon: Heart, label: 'Conditions', value: pet.health_conditions?.join(', ') || 'None' },
  ];

  const extendedInfo = [
    { icon: Syringe, label: 'Vaccinations', value: pet.vaccinations?.join(', ') || 'Check records' },
    { icon: Heart, label: 'Surgeries', value: pet.surgeries?.join(', ') || 'None' },
    { icon: Phone, label: 'Regular Vet', value: pet.regular_vet || 'Not set' },
    { icon: Phone, label: 'Emergency Contact', value: pet.emergency_contact || 'Not set' },
    { icon: Shield, label: 'Insurance', value: pet.insurance || 'None' },
  ];

  const shareViaWhatsApp = () => {
    const text = `*${pet.name}'s Emergency File*
    
Breed: ${pet.breed || 'Unknown'}
Age: ${petAge}
Weight: ${pet.weight ? `${pet.weight} kg` : 'Not recorded'}
Allergies: ${pet.allergies?.join(', ') || 'None known'}
Medications: ${pet.medications?.join(', ') || 'None'}
Conditions: ${pet.health_conditions?.join(', ') || 'None'}
Vaccinations: ${pet.vaccinations?.join(', ') || 'Check records'}

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
                <p className="text-sm text-emerald-700">{pet.breed} • {petAge}</p>
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

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {emergencyInfo.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-lg ${item.highlight ? 'bg-red-100 border border-red-200' : 'bg-white/70'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className={`w-4 h-4 ${item.highlight ? 'text-red-600' : 'text-emerald-600'}`} />
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
                <p className={`text-sm font-medium ${item.highlight ? 'text-red-700' : 'text-gray-900'}`}>
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
