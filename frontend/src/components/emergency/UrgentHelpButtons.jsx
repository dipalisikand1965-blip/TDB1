/**
 * UrgentHelpButtons.jsx
 * Top of Emergency page - Panic mode buttons
 * No scrolling, no thinking - immediate action
 */

import React from 'react';
import { Phone, MapPin, Skull, Ambulance, FileText } from 'lucide-react';

const UrgentHelpButtons = ({ onFindClinic, onOpenPetFile, petName }) => {
  const buttons = [
    {
      id: 'call-vet',
      icon: Phone,
      label: 'Call Vet',
      sublabel: 'Emergency line',
      color: 'from-red-500 to-red-600',
      action: () => window.open('tel:+918971702582', '_self')
    },
    {
      id: 'find-clinic',
      icon: MapPin,
      label: 'Find Clinic',
      sublabel: 'Nearest open',
      color: 'from-orange-500 to-orange-600',
      action: onFindClinic
    },
    {
      id: 'poison-help',
      icon: Skull,
      label: 'Poison Help',
      sublabel: 'Toxic ingestion',
      color: 'from-purple-500 to-purple-600',
      action: () => window.open('https://wa.me/918971702582?text=URGENT: My pet may have been poisoned', '_blank')
    },
    {
      id: 'ambulance',
      icon: Ambulance,
      label: 'Ambulance',
      sublabel: 'Pet transport',
      color: 'from-blue-500 to-blue-600',
      action: () => window.open('https://wa.me/918971702582?text=URGENT: Need pet ambulance/transport', '_blank')
    },
    {
      id: 'pet-file',
      icon: FileText,
      label: petName ? `${petName}'s File` : 'Pet File',
      sublabel: 'Medical info',
      color: 'from-emerald-500 to-emerald-600',
      action: onOpenPetFile
    }
  ];

  return (
    <section className="py-6 px-4 bg-gradient-to-b from-red-50 to-white" data-testid="urgent-help-section">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Need help right now?</h2>
          <p className="text-sm text-gray-600">Tap for immediate assistance</p>
        </div>
        
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {buttons.map((btn) => (
            <button
              key={btn.id}
              onClick={btn.action}
              className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-gradient-to-br ${btn.color} text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
              data-testid={`urgent-btn-${btn.id}`}
            >
              <btn.icon className="w-6 h-6 sm:w-8 sm:h-8 mb-1" />
              <span className="text-xs sm:text-sm font-semibold text-center leading-tight">{btn.label}</span>
              <span className="text-[10px] sm:text-xs opacity-80 hidden sm:block">{btn.sublabel}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UrgentHelpButtons;
