/**
 * ServiceRequestBuilder.jsx
 * 
 * Request Builder Modal - Full-screen on mobile, modal on desktop
 * Opens when user taps a service launcher
 * 
 * Features:
 * - Pet context auto-filled
 * - Service-specific presets
 * - Date/time preferences
 * - Notes
 * - Submit → creates ticket
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  X, Calendar, MapPin, Clock, PawPrint,
  Loader2, Check, ChevronDown, AlertCircle
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

// Service-specific configs
const SERVICE_CONFIGS = {
  grooming: {
    title: 'Book Grooming',
    subtitle: 'Bath, haircut, nail trim & more',
    presets: ['Full grooming', 'Bath only', 'Nail trim', 'Hair styling'],
  },
  training: {
    title: 'Book Training',
    subtitle: 'Behaviour & obedience sessions',
    presets: ['Basic obedience', 'Puppy training', 'Behaviour correction', 'Agility'],
  },
  boarding: {
    title: 'Book Boarding',
    subtitle: 'Overnight stays with care',
    presets: ['Day boarding', 'Overnight stay', 'Extended stay'],
    hasDateRange: true,
  },
  vet_visit: {
    title: 'Book Vet Visit',
    subtitle: 'Health check & medical care',
    presets: ['Routine checkup', 'Vaccination', 'Dental care', 'Health concern'],
    hasUrgency: true,
  },
  walking: {
    title: 'Book Dog Walking',
    subtitle: 'Daily walks & exercise',
    presets: ['30 min walk', '1 hour walk', 'Play session'],
  },
  photography: {
    title: 'Book Pet Photography',
    subtitle: 'Professional photo shoot',
    presets: ['Studio shoot', 'Outdoor shoot', 'Home shoot', 'Special occasion'],
  },
  party_setup: {
    title: 'Book Party Setup',
    subtitle: 'Celebration arrangements',
    presets: ['Birthday party', 'Gotcha day', 'Holiday celebration'],
  },
  travel: {
    title: 'Book Pet Travel',
    subtitle: 'Relocation & transport',
    presets: ['City taxi', 'Airport transfer', 'Inter-city travel'],
    hasDestination: true,
  },
};

const TIME_OPTIONS = [
  { value: 'morning', label: 'Morning (9 AM - 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM - 4 PM)' },
  { value: 'evening', label: 'Evening (4 PM - 7 PM)' },
  { value: 'flexible', label: 'Flexible' },
];

const URGENCY_OPTIONS = [
  { value: 'routine', label: 'Routine - Flexible timing' },
  { value: 'soon', label: 'Soon - Within this week' },
  { value: 'urgent', label: 'Urgent - Need to see today' },
];

// Pet chip component
const PetChip = memo(({ pet, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                ${selected 
                  ? 'bg-purple-500/20 border border-purple-500/40' 
                  : 'bg-slate-800/40 border border-white/5 hover:border-purple-500/20'}`}
    data-testid={`pet-chip-${pet.id || pet._id}`}
  >
    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
      {pet.photo ? (
        <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
      ) : (
        <PawPrint className="w-3 h-3 text-slate-400" />
      )}
    </div>
    <span className={`text-sm ${selected ? 'text-purple-300' : 'text-slate-300'}`}>
      {pet.name}
    </span>
    {selected && <Check className="w-4 h-4 text-purple-400 ml-1" />}
  </button>
));

// Preset chip component
const PresetChip = memo(({ label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all
                ${selected 
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' 
                  : 'bg-slate-800/60 text-slate-400 border border-white/5 hover:border-purple-500/30'}`}
  >
    {label}
  </button>
));

// Main Component
const ServiceRequestBuilder = ({
  isOpen,
  onClose,
  service,
  currentPet = null,
  allPets = [],
  token = null,
  onSuccess = null,
}) => {
  const [selectedPets, setSelectedPets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [date, setDate] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [timePreference, setTimePreference] = useState('');
  const [urgency, setUrgency] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const config = SERVICE_CONFIGS[service?.id] || SERVICE_CONFIGS.grooming;

  // Initialize with current pet
  useEffect(() => {
    if (isOpen && currentPet) {
      setSelectedPets([currentPet.id || currentPet._id]);
    }
  }, [isOpen, currentPet]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedPets([]);
        setSelectedPreset('');
        setDate('');
        setDateEnd('');
        setTimePreference('');
        setUrgency('');
        setLocation('');
        setNotes('');
        setError(null);
        setSuccess(false);
      }, 300);
    }
  }, [isOpen]);

  const togglePet = useCallback((petId) => {
    setSelectedPets(prev => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
    );
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (selectedPets.length === 0) {
      setError('Please select at least one pet');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const petNames = selectedPets.map(id => {
        const pet = allPets.find(p => (p.id || p._id) === id);
        return pet?.name || 'Pet';
      });

      // Detect device type for analytics
      const isMobile = window.innerWidth < 768;
      const deviceType = isMobile ? 'mobile' : 'desktop';

      const payload = {
        service_type: service?.id || 'general',
        pet_ids: selectedPets,
        pet_names: petNames,
        title: selectedPreset || config.title?.replace('Book ', '') || service?.name,
        description: notes || '',
        preferred_time_window: timePreference || 'flexible',
        location: location || '',
        constraints: {
          preset: selectedPreset,
          urgency: urgency,
          preferred_date: date,
          date_end: dateEnd,
          device_type: deviceType,
        },
        pillar: service?.pillar || 'care',
        source: 'services_tab',
      };

      const response = await fetch(`${API_BASE}/api/os/services/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create request');
      }

      setSuccess(true);
      onSuccess?.(data);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[REQUEST] Submit error:', err);
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !service) return null;

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" data-testid="request-builder-success">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full sm:max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-white/10 p-8 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Request Submitted!</h3>
          <p className="text-slate-400">Your Concierge has been notified and will reach out shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" data-testid="request-builder-modal">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full sm:max-w-lg max-h-[90vh] bg-slate-900 rounded-t-2xl sm:rounded-2xl
                      border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div>
            <h2 className="text-lg font-semibold text-white">{config.title}</h2>
            <p className="text-xs text-slate-400">{config.subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            data-testid="close-request-builder"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5">
          
          {/* Pet Selection */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Which pet(s)?</label>
            <div className="flex flex-wrap gap-2">
              {allPets.map((pet) => (
                <PetChip
                  key={pet.id || pet._id}
                  pet={pet}
                  selected={selectedPets.includes(pet.id || pet._id)}
                  onClick={() => togglePet(pet.id || pet._id)}
                />
              ))}
              {allPets.length === 0 && (
                <p className="text-sm text-slate-500">No pets found. Please add a pet first.</p>
              )}
            </div>
          </div>
          
          {/* Preset Selection */}
          {config.presets && (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">What do you need?</label>
              <div className="flex flex-wrap gap-2">
                {config.presets.map((preset) => (
                  <PresetChip
                    key={preset}
                    label={preset}
                    selected={selectedPreset === preset}
                    onClick={() => setSelectedPreset(selectedPreset === preset ? '' : preset)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Date Selection */}
          <div className={config.hasDateRange ? 'grid grid-cols-2 gap-3' : ''}>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">
                {config.hasDateRange ? 'Check-in' : 'Preferred date'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-800/60 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white text-base
                             focus:border-purple-500/50 focus:outline-none transition-colors"
                  data-testid="date-input"
                />
              </div>
            </div>
            
            {config.hasDateRange && (
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Check-out</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    min={date || new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-800/60 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white text-base
                               focus:border-purple-500/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Time Preference */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Preferred time</label>
            <div className="relative">
              <select
                value={timePreference}
                onChange={(e) => setTimePreference(e.target.value)}
                className="w-full bg-slate-800/60 border border-white/10 rounded-lg px-3 py-2.5 text-white text-base
                           focus:border-purple-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                data-testid="time-select"
              >
                <option value="" className="bg-slate-800">Select time preference</option>
                {TIME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-800">{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
          
          {/* Urgency (for vet visits) */}
          {config.hasUrgency && (
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">How urgent?</label>
              <div className="relative">
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full bg-slate-800/60 border border-white/10 rounded-lg px-3 py-2.5 text-white text-base
                             focus:border-purple-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-800">Select urgency</option>
                  {URGENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-800">{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>
          )}
          
          {/* Location / Destination */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              {config.hasDestination ? 'Pickup & Drop' : 'Location'}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={config.hasDestination ? 'e.g., Home to Airport' : 'e.g., Home visit, Salon, etc.'}
                className="w-full bg-slate-800/60 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white text-base
                           placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none transition-colors"
                data-testid="location-input"
              />
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Additional notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements, allergies, or preferences..."
              rows={3}
              className="w-full bg-slate-800/60 border border-white/10 rounded-lg px-3 py-2.5 text-white text-base
                         placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none transition-colors resize-none"
              data-testid="notes-input"
            />
          </div>
          
          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            </div>
          )}
        </form>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-900/80 backdrop-blur-sm">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || selectedPets.length === 0}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold
                       rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            data-testid="submit-request-btn"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestBuilder;
