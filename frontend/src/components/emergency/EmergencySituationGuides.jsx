/**
 * EmergencySituationGuides.jsx
 * Actionable emergency situation guides
 * What to do NOW, what NOT to do, when to seek help
 */

import React, { useState } from 'react';
import { 
  ChevronDown, ChevronUp, AlertTriangle, Phone, 
  ShoppingBag, MapPin, Check, X, ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';

const EMERGENCY_GUIDES = [
  {
    id: 'poisoning',
    title: 'My pet ate something toxic',
    icon: '☠️',
    urgency: 'critical',
    doNow: [
      'Remove any remaining toxin from reach',
      'Note what was eaten and how much',
      'Check for symptoms: vomiting, drooling, tremors',
      'Call emergency vet immediately'
    ],
    dontDo: [
      'Do NOT induce vomiting unless vet advises',
      'Do NOT give milk or home remedies',
      'Do NOT wait to see if symptoms develop'
    ],
    leaveIf: [
      'Seizures or tremors',
      'Difficulty breathing',
      'Collapse or unconsciousness',
      'Severe vomiting or diarrhea'
    ],
    products: ['Activated charcoal (vet-advised)', 'Emergency contact card']
  },
  {
    id: 'bleeding',
    title: 'My dog is bleeding',
    icon: '🩸',
    urgency: 'high',
    doNow: [
      'Apply firm pressure with clean cloth',
      'Keep pet calm and still',
      'Elevate wound if possible',
      'Do not remove cloth - add more if soaking through'
    ],
    dontDo: [
      'Do NOT use tourniquet unless trained',
      'Do NOT clean deep wounds yourself',
      'Do NOT apply ointments to open wounds'
    ],
    leaveIf: [
      'Bleeding doesn\'t slow after 10 mins pressure',
      'Blood is spurting',
      'Wound is deep or gaping',
      'Pet is weak or pale gums'
    ],
    products: ['Sterile gauze', 'Bandage wrap', 'First-aid kit']
  },
  {
    id: 'breathing',
    title: 'My pet is struggling to breathe',
    icon: '😮‍💨',
    urgency: 'critical',
    doNow: [
      'Keep pet calm - stress worsens breathing',
      'Remove collar or anything tight',
      'Keep airway clear - check for obstructions',
      'Go to emergency vet immediately'
    ],
    dontDo: [
      'Do NOT try to give water',
      'Do NOT lay flat if struggling - keep head elevated',
      'Do NOT wait - this is an emergency'
    ],
    leaveIf: [
      'Blue/purple gums or tongue',
      'Gasping or open-mouth breathing',
      'Collapse',
      'Any breathing difficulty'
    ],
    products: ['Emergency contact card', 'Pet carrier']
  },
  {
    id: 'vomiting',
    title: 'My pet is vomiting',
    icon: '🤮',
    urgency: 'medium',
    doNow: [
      'Remove food for 12-24 hours',
      'Offer small amounts of water',
      'Note frequency and what vomit looks like',
      'Check for foreign objects in vomit'
    ],
    dontDo: [
      'Do NOT give human medications',
      'Do NOT force food or water',
      'Do NOT ignore blood in vomit'
    ],
    leaveIf: [
      'Blood in vomit',
      'Vomiting for more than 24 hours',
      'Lethargy or weakness',
      'Signs of dehydration (dry gums)',
      'Suspected toxin ingestion'
    ],
    products: ['Electrolyte solution', 'Bland recovery food']
  },
  {
    id: 'seizure',
    title: 'My dog is having a seizure',
    icon: '⚡',
    urgency: 'critical',
    doNow: [
      'Move objects away to prevent injury',
      'Time the seizure',
      'Do NOT restrain or put anything in mouth',
      'Keep environment quiet and dim'
    ],
    dontDo: [
      'Do NOT put hands near mouth',
      'Do NOT try to hold tongue',
      'Do NOT move pet during seizure'
    ],
    leaveIf: [
      'Seizure lasts more than 3 minutes',
      'Multiple seizures in a row',
      'First-time seizure',
      'Pet doesn\'t recover within 30 mins'
    ],
    products: ['Soft blanket', 'Emergency contact card']
  },
  {
    id: 'limping',
    title: 'My pet is limping',
    icon: '🦴',
    urgency: 'medium',
    doNow: [
      'Restrict movement - no jumping or stairs',
      'Check paw for cuts, thorns, or swelling',
      'Apply cold compress if swollen (10 mins)',
      'Monitor for worsening'
    ],
    dontDo: [
      'Do NOT give human pain medication',
      'Do NOT massage if very painful',
      'Do NOT force pet to walk'
    ],
    leaveIf: [
      'Visible bone or severe deformity',
      'Unable to bear any weight',
      'Severe swelling',
      'Signs of severe pain (crying, biting)'
    ],
    products: ['Cold pack', 'Recovery cone', 'Joint supplement']
  },
  {
    id: 'heatstroke',
    title: 'Heatstroke',
    icon: '🌡️',
    urgency: 'critical',
    doNow: [
      'Move to shade/AC immediately',
      'Apply cool (NOT cold) water to body',
      'Focus on paws, ears, and belly',
      'Offer small amounts of cool water'
    ],
    dontDo: [
      'Do NOT use ice or ice water',
      'Do NOT force water if pet can\'t swallow',
      'Do NOT cover with wet towels (traps heat)'
    ],
    leaveIf: [
      'Temp above 104°F / 40°C',
      'Bright red gums',
      'Collapse or unconsciousness',
      'Vomiting or diarrhea'
    ],
    products: ['Cooling mat', 'Travel water bowl', 'Thermometer']
  },
  {
    id: 'choking',
    title: 'Choking',
    icon: '😫',
    urgency: 'critical',
    doNow: [
      'Check if you can see the object',
      'If visible, try to remove with fingers',
      'For small dogs: hold upside down, pat back',
      'For large dogs: Heimlich-like thrust'
    ],
    dontDo: [
      'Do NOT blindly sweep mouth',
      'Do NOT push object deeper',
      'Do NOT delay if pet can\'t breathe'
    ],
    leaveIf: [
      'Object won\'t dislodge',
      'Pet collapses',
      'Blue gums',
      'Severe distress'
    ],
    products: ['Pet first-aid guide']
  },
  {
    id: 'lost',
    title: 'My pet is missing',
    icon: '🔍',
    urgency: 'high',
    doNow: [
      'Search immediate area thoroughly',
      'Alert neighbors and local community',
      'Post on social media with recent photo',
      'Contact local shelters and vets'
    ],
    dontDo: [
      'Do NOT panic - stay organized',
      'Do NOT chase if spotted - call calmly',
      'Do NOT wait to start searching'
    ],
    leaveIf: [],
    products: ['GPS tracker', 'ID tags']
  },
  {
    id: 'unresponsive',
    title: 'My pet is unresponsive',
    icon: '💔',
    urgency: 'critical',
    doNow: [
      'Check for breathing - watch chest',
      'Check pulse - inside thigh',
      'Call emergency vet immediately',
      'Begin CPR if trained and no pulse'
    ],
    dontDo: [
      'Do NOT shake violently',
      'Do NOT give mouth-to-snout if not trained',
      'Do NOT delay getting to vet'
    ],
    leaveIf: [
      'No breathing',
      'No pulse',
      'Any unresponsiveness'
    ],
    products: ['Emergency contact card']
  },
  // Additional Emergency Guides
  {
    id: 'eye_injury',
    title: 'Eye injury or irritation',
    icon: '👁️',
    urgency: 'high',
    doNow: [
      'Prevent pet from rubbing eyes',
      'Flush gently with saline or clean water',
      'Use e-collar if available',
      'Keep pet in dim light'
    ],
    dontDo: [
      'Do NOT try to remove embedded objects',
      'Do NOT use human eye drops',
      'Do NOT apply pressure to the eye'
    ],
    leaveIf: [
      'Visible wound or object in eye',
      'Eye is bulging or sunken',
      'Bleeding from eye',
      'Sudden blindness'
    ],
    products: ['Saline solution', 'E-collar', 'Eye wash']
  },
  {
    id: 'bee_sting',
    title: 'Bee or insect sting',
    icon: '🐝',
    urgency: 'medium',
    doNow: [
      'Remove stinger by scraping (not squeezing)',
      'Apply cold compress to reduce swelling',
      'Monitor for allergic reaction',
      'Give antihistamine if vet-approved'
    ],
    dontDo: [
      'Do NOT squeeze stinger out',
      'Do NOT apply human medications without vet advice',
      'Do NOT ignore swelling near throat'
    ],
    leaveIf: [
      'Swelling near face/throat',
      'Difficulty breathing',
      'Vomiting or diarrhea',
      'Multiple stings'
    ],
    products: ['Ice pack', 'Pet antihistamine', 'First-aid kit']
  },
  {
    id: 'bloat',
    title: 'Bloat / Twisted stomach',
    icon: '🎈',
    urgency: 'critical',
    doNow: [
      'This is a LIFE-THREATENING emergency',
      'Go to emergency vet IMMEDIATELY',
      'Do not wait - minutes matter',
      'Call ahead so they prepare'
    ],
    dontDo: [
      'Do NOT try home remedies',
      'Do NOT wait to see if it improves',
      'Do NOT give food or water'
    ],
    leaveIf: [
      'Distended/hard abdomen',
      'Trying to vomit but nothing comes up',
      'Restlessness and pacing',
      'Excessive drooling'
    ],
    products: ['Emergency vet contacts saved']
  },
  {
    id: 'allergic_reaction',
    title: 'Allergic reaction',
    icon: '🤧',
    urgency: 'high',
    doNow: [
      'Identify and remove allergen if possible',
      'Check for swelling, especially face/throat',
      'Give vet-approved antihistamine',
      'Monitor breathing closely'
    ],
    dontDo: [
      'Do NOT ignore facial swelling',
      'Do NOT wait if breathing changes',
      'Do NOT give medications without vet guidance'
    ],
    leaveIf: [
      'Facial/throat swelling',
      'Difficulty breathing',
      'Collapse',
      'Hives spreading rapidly'
    ],
    products: ['Pet antihistamine', 'Emergency contact card']
  },
  {
    id: 'fight_injuries',
    title: 'Fight injuries',
    icon: '🐕',
    urgency: 'high',
    doNow: [
      'Assess wounds carefully',
      'Clean superficial wounds with saline',
      'Apply pressure to any bleeding',
      'Check for bite wounds (can be deeper than they look)'
    ],
    dontDo: [
      'Do NOT ignore small punctures - they can abscess',
      'Do NOT use hydrogen peroxide on wounds',
      'Do NOT let pet lick wounds excessively'
    ],
    leaveIf: [
      'Deep or gaping wounds',
      'Wounds near eyes/throat/chest',
      'Signs of shock',
      'Multiple bite wounds'
    ],
    products: ['Saline solution', 'Sterile gauze', 'E-collar']
  }
];

const EmergencySituationGuides = ({ onFindClinic, onContactConcierge }) => {
  const [expandedGuide, setExpandedGuide] = useState(null);

  const urgencyColors = {
    critical: 'bg-red-100 border-red-300 text-red-800',
    high: 'bg-orange-100 border-orange-300 text-orange-800',
    medium: 'bg-yellow-100 border-yellow-300 text-yellow-800'
  };

  return (
    <section className="py-6 px-4" data-testid="emergency-guides-section">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Emergency Guides</h2>
          <p className="text-sm text-gray-600">What to do in common emergency situations</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
          {EMERGENCY_GUIDES.map((guide) => (
            <button
              key={guide.id}
              onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                expandedGuide === guide.id 
                  ? 'border-rose-500 bg-rose-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-rose-300'
              }`}
            >
              <span className="text-2xl">{guide.icon}</span>
              <p className="text-xs font-medium text-gray-700 mt-1 line-clamp-2">{guide.title}</p>
            </button>
          ))}
        </div>

        {/* Expanded Guide Content */}
        {expandedGuide && (
          <div className="bg-white rounded-xl border-2 border-rose-200 p-4 sm:p-6 shadow-lg">
            {(() => {
              const guide = EMERGENCY_GUIDES.find(g => g.id === expandedGuide);
              if (!guide) return null;
              
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{guide.icon}</span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{guide.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${urgencyColors[guide.urgency]}`}>
                          {guide.urgency === 'critical' ? '🚨 Critical' : guide.urgency === 'high' ? '⚠️ High Priority' : '⚡ Act Soon'}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setExpandedGuide(null)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    {/* Do Now */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <Check className="w-4 h-4" /> Do NOW
                      </h4>
                      <ul className="space-y-2">
                        {guide.doNow.map((item, idx) => (
                          <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Don't Do */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <X className="w-4 h-4" /> Do NOT
                      </h4>
                      <ul className="space-y-2">
                        {guide.dontDo.map((item, idx) => (
                          <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                            <X className="w-3 h-3 mt-1 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* When to Leave */}
                  {guide.leaveIf.length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-orange-800 mb-2">🚗 Go to vet IMMEDIATELY if:</h4>
                      <div className="flex flex-wrap gap-2">
                        {guide.leaveIf.map((item, idx) => (
                          <span key={idx} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={onFindClinic} className="bg-blue-600 hover:bg-blue-700">
                      <MapPin className="w-4 h-4 mr-2" />
                      Find Nearby Clinic
                    </Button>
                    <Button onClick={onContactConcierge} variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Concierge
                    </Button>
                    {guide.products.length > 0 && (
                      <Button variant="ghost" className="text-gray-600">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Related Products
                      </Button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </section>
  );
};

export default EmergencySituationGuides;
