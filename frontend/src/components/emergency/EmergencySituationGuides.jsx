/**
 * EmergencySituationGuides.jsx
 * Actionable emergency situation guides fetched from API
 * What to do NOW, what NOT to do, when to seek help
 * 
 * NOTE: Guides are now fetched from /api/guided-paths/emergency
 * and managed via Admin Panel
 */

import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, ChevronUp, AlertTriangle, Phone, 
  ShoppingBag, MapPin, Check, X, ArrowRight, Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { API_URL } from '../../utils/api';

// Icon mapping from API icon names to emojis
const ICON_MAP = {
  'AlertTriangle': '⚠️',
  'Droplet': '🩸',
  'Wind': '😮‍💨',
  'Sun': '🌡️',
  'Zap': '⚡',
  'AlertCircle': '😫',
  'Eye': '👁️',
  'Heart': '💔',
  'Shield': '🛡️',
  'Search': '🔍',
  // Default fallback
  'default': '🚨'
};

// Severity mapping
const getSeverityFromColor = (color) => {
  if (color?.includes('red-7') || color?.includes('red-8') || color?.includes('red-9')) return 'critical';
  if (color?.includes('red-5') || color?.includes('red-6') || color?.includes('rose')) return 'critical';
  if (color?.includes('orange') || color?.includes('amber')) return 'high';
  if (color?.includes('yellow') || color?.includes('cyan') || color?.includes('blue')) return 'high';
  if (color?.includes('purple') || color?.includes('indigo')) return 'high';
  return 'medium';
};

// Transform API data to component format
const transformApiPath = (path) => {
  const steps = path.steps || [];
  
  // Extract do/don't/leave from steps based on step titles
  let doNow = [];
  let dontDo = [];
  let leaveIf = [];
  
  steps.forEach(step => {
    const title = step.title?.toLowerCase() || '';
    const items = step.items || [];
    
    if (title.includes('immediate') || title.includes('do now') || title.includes('first') || title.includes('signs') || title.includes('warning')) {
      doNow = [...doNow, ...items];
    } else if (title.includes('do not') || title.includes('don\'t') || title.includes('emergency')) {
      dontDo = [...dontDo, ...items];
    } else if (title.includes('when to') || title.includes('leave') || title.includes('causes') || title.includes('high risk')) {
      leaveIf = [...leaveIf, ...items];
    } else {
      // Default: add to doNow
      doNow = [...doNow, ...items];
    }
  });
  
  return {
    id: path.id,
    title: path.title,
    icon: ICON_MAP[path.icon] || ICON_MAP['default'],
    urgency: path.severity || getSeverityFromColor(path.color),
    doNow: doNow.length > 0 ? doNow : ['Follow vet guidance', 'Stay calm', 'Call emergency line'],
    dontDo: dontDo.length > 0 ? dontDo : ['Do NOT panic', 'Do NOT delay seeking help'],
    leaveIf: leaveIf,
    products: ['First-aid kit', 'Emergency contact card']
  };
};

// Fallback guides for when API is unavailable
const FALLBACK_GUIDES = [
  {
    id: 'emergency-poisoning',
    title: 'Suspected Poisoning',
    icon: '☠️',
    urgency: 'critical',
    doNow: ['Remove from source', 'Note what was eaten', 'Call vet immediately'],
    dontDo: ['Do NOT induce vomiting unless told', 'Do NOT give milk'],
    leaveIf: ['Seizures', 'Difficulty breathing', 'Collapse'],
    products: ['Emergency contact card']
  },
  {
    id: 'emergency-breathing',
    title: 'Breathing Difficulties',
    icon: '😮‍💨',
    urgency: 'critical',
    doNow: ['Keep pet calm', 'Clear airway if safe', 'Rush to vet'],
    dontDo: ['Do NOT lay flat if struggling'],
    leaveIf: ['Blue gums/tongue', 'Gasping', 'Collapse'],
    products: ['Pet carrier']
  },
  {
    id: 'emergency-heatstroke',
    title: 'Heat Stroke',
    icon: '🌡️',
    urgency: 'critical',
    doNow: ['Move to shade', 'Apply cool water', 'Offer water'],
    dontDo: ['Do NOT use ice', 'Do NOT cover with wet towels'],
    leaveIf: ['Temp above 40°C', 'Collapse', 'Vomiting'],
    products: ['Cooling mat', 'Thermometer']
  }
];

const EmergencySituationGuides = ({ onFindClinic, onContactConcierge }) => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGuide, setExpandedGuide] = useState(null);

  // Fetch guides from API on mount
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const response = await fetch(`${API_URL}/api/guided-paths/emergency`);
        if (response.ok) {
          const data = await response.json();
          const transformedGuides = (data.paths || []).map(transformApiPath);
          setGuides(transformedGuides.length > 0 ? transformedGuides : FALLBACK_GUIDES);
        } else {
          setGuides(FALLBACK_GUIDES);
        }
      } catch (error) {
        console.error('Failed to fetch emergency guides:', error);
        setGuides(FALLBACK_GUIDES);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGuides();
  }, []);

  const urgencyColors = {
    critical: 'bg-red-100 border-red-300 text-red-800',
    high: 'bg-orange-100 border-orange-300 text-orange-800',
    medium: 'bg-yellow-100 border-yellow-300 text-yellow-800'
  };

  if (loading) {
    return (
      <section className="py-6 px-4" data-testid="emergency-guides-section">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-red-600 mr-2" />
            <span className="text-gray-600">Loading emergency guides...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 px-4" data-testid="emergency-guides-section">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Emergency Guides</h2>
          <p className="text-sm text-gray-600">What to do in common emergency situations</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
          {guides.map((guide) => (
            <button
              key={guide.id}
              onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                expandedGuide === guide.id 
                  ? 'border-rose-500 bg-rose-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-rose-300'
              }`}
              data-testid={`guide-${guide.id}`}
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
              const guide = guides.find(g => g.id === expandedGuide);
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
                      Contact Concierge®
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
