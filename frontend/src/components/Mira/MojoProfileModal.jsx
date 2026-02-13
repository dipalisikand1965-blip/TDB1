/**
 * MojoProfileModal.jsx
 * ====================
 * MOJO = Pet Operating System Core - The Pet Identity Layer
 * 
 * "Single source of truth about the pet."
 * "Mira's entire intelligence comes from here."
 * "If this tab is strong → Mira becomes an OS."
 * "If weak → Mira becomes chat."
 * 
 * SECTIONS:
 * 1. Pet Snapshot (Always Visible - The Passport)
 * 2. Soul Profile (Default Expanded - Core Intelligence)
 * 3. Health Profile (Accordion)
 * 4. Diet & Food (Accordion)
 * 5. Behaviour & Training (Accordion)
 * 6. Grooming & Care (Accordion)
 * 7. Routine Tracker (Accordion)
 * 8. Documents Vault (Accordion)
 * 9. Life Timeline (Accordion)
 * 10. Preferences & Constraints (Accordion)
 * 11. Membership & Rewards (Bottom Section)
 * 
 * MOBILE: Full-screen sheet/page
 * DESKTOP: Modal overlay
 * 
 * Both "Mojo" name and "78% SOUL" badge open this modal.
 * Soul badge deep-links to Soul Profile section.
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, ChevronRight, ChevronDown, Heart, Brain, Shield, Apple, 
  GraduationCap, Scissors, Calendar, FileText, Clock, Settings,
  Award, Sparkles, Camera, Edit2, RefreshCw, AlertCircle,
  User, MapPin, Cake, Scale, ArrowLeft, Loader2, Check,
  Crown, Star, Gift, Wallet, Plus
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

// Section configuration with icons and labels
const PROFILE_SECTIONS = [
  { id: 'soul', icon: Heart, label: 'Soul Profile', color: 'purple', defaultOpen: true },
  { id: 'health', icon: Shield, label: 'Health Profile', color: 'red' },
  { id: 'diet', icon: Apple, label: 'Diet & Food', color: 'orange' },
  { id: 'behaviour', icon: GraduationCap, label: 'Behaviour & Training', color: 'blue' },
  { id: 'grooming', icon: Scissors, label: 'Grooming & Care', color: 'pink' },
  { id: 'routine', icon: Calendar, label: 'Routine Tracker', color: 'green' },
  { id: 'documents', icon: FileText, label: 'Documents Vault', color: 'cyan' },
  { id: 'timeline', icon: Clock, label: 'Life Timeline', color: 'amber' },
  { id: 'preferences', icon: Settings, label: 'Preferences & Constraints', color: 'gray' },
];

// Color mapping for sections
const SECTION_COLORS = {
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', icon: 'text-purple-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: 'text-orange-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-400' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', icon: 'text-pink-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: 'text-green-400' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: 'text-cyan-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
  gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', icon: 'text-gray-400' },
};

// Calculate section completeness from real data
const calculateSectionCompleteness = (sectionId, data) => {
  const soulAnswers = data?.doggy_soul_answers || {};
  const preferences = data?.preferences || {};
  const soul = data?.soul || {};
  
  switch (sectionId) {
    case 'soul': {
      // Soul fields: personality, temperament, energy_level, social_style, anxiety, comfort_preferences
      const soulFields = ['temperament', 'general_nature', 'energy_level', 'play_style', 'social_with_dogs', 
        'social_with_people', 'confidence_level', 'anxiety_triggers', 'comfort_preferences'];
      const filled = soulFields.filter(f => soulAnswers[f] && soulAnswers[f] !== 'Unknown').length;
      return Math.round((filled / soulFields.length) * 100);
    }
    case 'health': {
      // Health fields: allergies, weight, vaccinations, vet_info, medications
      const healthFields = ['food_allergies', 'weight', 'spayed_neutered', 'vaccination_status'];
      const filled = healthFields.filter(f => {
        const val = soulAnswers[f] || preferences[f];
        return val && val !== 'Unknown' && val !== '' && (!Array.isArray(val) || val.length > 0);
      }).length;
      return Math.round((filled / healthFields.length) * 100);
    }
    case 'diet': {
      // Diet fields: diet_type, feeding_frequency, favorite_flavors, treats
      const dietFields = ['diet_type', 'food_type', 'feeding_schedule', 'favorite_flavors', 'treat_preferences'];
      const filled = dietFields.filter(f => {
        const val = soulAnswers[f] || preferences[f];
        return val && val !== 'Unknown' && val !== '' && (!Array.isArray(val) || val.length > 0);
      }).length;
      return Math.round((filled / dietFields.length) * 100);
    }
    case 'behaviour': {
      // Behaviour fields: training_level, commands, leash_behaviour
      const behaviourFields = ['training_level', 'commands_known', 'leash_behavior', 'behavioral_issues'];
      const filled = behaviourFields.filter(f => soulAnswers[f] && soulAnswers[f] !== 'Unknown').length;
      return Math.round((filled / behaviourFields.length) * 100);
    }
    case 'grooming': {
      // Grooming fields: coat_type, grooming_frequency, skin_sensitivity
      const groomingFields = ['coat_type', 'grooming_frequency', 'skin_sensitivity', 'bath_frequency'];
      const filled = groomingFields.filter(f => soulAnswers[f] && soulAnswers[f] !== 'Unknown').length;
      return Math.round((filled / groomingFields.length) * 100);
    }
    case 'routine': {
      // Routine: walk_frequency, play_time, sleep_schedule
      const routineFields = ['walk_frequency', 'exercise_needs', 'sleep_pattern', 'daily_routine'];
      const filled = routineFields.filter(f => soulAnswers[f] && soulAnswers[f] !== 'Unknown').length;
      return Math.round((filled / routineFields.length) * 100);
    }
    case 'documents': {
      // Documents: vaccination_records, insurance, prescriptions
      const docs = data?.documents || [];
      return docs.length > 0 ? Math.min(docs.length * 20, 100) : 0;
    }
    case 'timeline': {
      // Timeline: events, milestones
      const timeline = data?.timeline || data?.life_events || [];
      return timeline.length > 0 ? Math.min(timeline.length * 10, 100) : 0;
    }
    case 'preferences': {
      // Preferences: constraints, likes, dislikes
      const prefFields = ['likes', 'dislikes', 'fear_triggers', 'special_needs'];
      const filled = prefFields.filter(f => {
        const val = soulAnswers[f] || preferences[f];
        return val && val !== 'Unknown' && val !== '' && (!Array.isArray(val) || val.length > 0);
      }).length;
      return Math.round((filled / prefFields.length) * 100);
    }
    default:
      return 0;
  }
};

// Get missing items for a section
const getMissingItems = (sectionId, data) => {
  const soulAnswers = data?.doggy_soul_answers || {};
  const preferences = data?.preferences || {};
  const missing = [];
  
  switch (sectionId) {
    case 'soul':
      if (!soulAnswers.temperament && !soulAnswers.general_nature) missing.push('temperament');
      if (!soulAnswers.energy_level) missing.push('energy level');
      if (!soulAnswers.play_style) missing.push('play style');
      break;
    case 'health':
      if (!soulAnswers.food_allergies && !preferences.allergies) missing.push('allergies');
      if (!soulAnswers.weight) missing.push('weight');
      if (!soulAnswers.vaccination_status) missing.push('vaccinations');
      break;
    case 'diet':
      if (!soulAnswers.diet_type && !soulAnswers.food_type) missing.push('diet type');
      if (!preferences.favorite_flavors) missing.push('favorite flavors');
      break;
    case 'behaviour':
      if (!soulAnswers.training_level) missing.push('training level');
      if (!soulAnswers.leash_behavior) missing.push('leash behavior');
      break;
    case 'grooming':
      if (!soulAnswers.coat_type) missing.push('coat type');
      if (!soulAnswers.grooming_frequency) missing.push('grooming schedule');
      break;
    case 'routine':
      if (!soulAnswers.walk_frequency) missing.push('walk routine');
      if (!soulAnswers.sleep_pattern) missing.push('sleep schedule');
      break;
    case 'documents':
      if (!(data?.documents?.length > 0)) missing.push('vaccination records', 'vet documents');
      break;
    case 'timeline':
      if (!(data?.timeline?.length > 0)) missing.push('milestones', 'life events');
      break;
    case 'preferences':
      if (!soulAnswers.fear_triggers && !preferences.fear_triggers) missing.push('fear triggers');
      if (!soulAnswers.likes) missing.push('likes');
      break;
  }
  
  return missing.slice(0, 2); // Return max 2 items
};

// Pet Snapshot Component (Always Visible Header)
const PetSnapshot = memo(({ pet, soulScore, membership, onEditClick, onSwitchPet, apiUrl }) => {
  // Handle various photo URL formats
  let petPhoto = pet?.photo || pet?.pet_photo || pet?.photo_url;
  
  // Handle relative URLs (e.g., /api/pet-photo/pet-xxx)
  if (petPhoto && petPhoto.startsWith('/api/')) {
    petPhoto = `${apiUrl}${petPhoto}`;
  } else if (petPhoto && !petPhoto.startsWith('http') && !petPhoto.startsWith('data:')) {
    petPhoto = `${apiUrl}${petPhoto}`;
  }
  
  const petName = pet?.name || 'Pet';
  const breed = pet?.breed || 'Unknown breed';
  const age = pet?.age || pet?.age_years ? `${pet?.age_years || pet?.age} years` : '';
  const gender = pet?.gender || '';
  const weight = pet?.doggy_soul_answers?.weight || pet?.weight || '';
  const city = pet?.city || pet?.doggy_soul_answers?.city || pet?.location?.city || '';
  
  return (
    <div className="mojo-snapshot" data-testid="mojo-pet-snapshot">
      {/* Pet Photo with Soul Score Ring */}
      <div className="snapshot-photo-container">
        <div className="snapshot-photo-ring" style={{ 
          background: `conic-gradient(from 0deg, #8B5CF6 ${soulScore * 3.6}deg, rgba(139, 92, 246, 0.2) ${soulScore * 3.6}deg)` 
        }}>
          {petPhoto ? (
            <img 
              src={petPhoto} 
              alt={petName}
              className="snapshot-photo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${petName}&backgroundColor=ffdfbf`;
              }}
            />
          ) : (
            <div className="snapshot-photo-placeholder">
              <span className="text-3xl">🐕</span>
            </div>
          )}
        </div>
        <button 
          className="snapshot-photo-edit"
          onClick={() => onEditClick?.('photo')}
          data-testid="edit-photo-btn"
        >
          <Camera className="w-3 h-3" />
        </button>
      </div>
      
      {/* Pet Info */}
      <div className="snapshot-info">
        <h1 className="snapshot-name">{petName}</h1>
        <p className="snapshot-details">
          {breed} {age && `• ${age}`} {gender && `• ${gender}`}
        </p>
        {(weight || city) && (
          <p className="snapshot-location">
            {weight && <span><Scale className="w-3 h-3 inline mr-1" />{weight}</span>}
            {city && <span className="ml-2"><MapPin className="w-3 h-3 inline mr-1" />{city}</span>}
          </p>
        )}
      </div>
      
      {/* Soul Score Badge */}
      <div className="snapshot-soul-score">
        <div className="soul-score-circle">
          <span className="soul-score-value">{Math.round(soulScore)}%</span>
          <span className="soul-score-label">SOUL KNOWN</span>
        </div>
      </div>
      
      {/* Membership & Points (if available) */}
      {membership && (
        <div className="snapshot-membership">
          {membership.tier && (
            <span className={`membership-badge tier-${membership.tier.toLowerCase()}`}>
              <Crown className="w-3 h-3" />
              {membership.tier}
            </span>
          )}
          {membership.paw_points !== undefined && (
            <span className="membership-points">
              <Star className="w-3 h-3" />
              {membership.paw_points.toLocaleString()} pts
            </span>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="snapshot-actions">
        <button 
          className="snapshot-action-btn"
          onClick={() => onEditClick?.('details')}
          data-testid="edit-details-btn"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button 
          className="snapshot-action-btn"
          onClick={onSwitchPet}
          data-testid="switch-pet-btn"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Switch Pet</span>
        </button>
      </div>
    </div>
  );
});

// Accordion Section Row Component
const SectionRow = memo(({ 
  section, 
  completeness, 
  missingItems, 
  isExpanded, 
  onToggle, 
  onAddClick,
  children 
}) => {
  const colors = SECTION_COLORS[section.color];
  const Icon = section.icon;
  
  return (
    <div 
      className={`mojo-section ${isExpanded ? 'expanded' : ''}`}
      data-testid={`mojo-section-${section.id}`}
    >
      {/* Section Header (Always Visible) */}
      <button 
        className={`section-header ${colors.bg} ${colors.border}`}
        onClick={() => {
          hapticFeedback.buttonTap();
          onToggle(section.id);
        }}
        data-testid={`section-toggle-${section.id}`}
      >
        <div className="section-header-left">
          <Icon className={`section-icon ${colors.icon}`} />
          <span className="section-title">{section.label}</span>
        </div>
        
        <div className="section-header-right">
          {/* Completeness Badge */}
          <span className={`section-completeness ${completeness === 0 ? 'empty' : completeness < 50 ? 'low' : completeness < 80 ? 'medium' : 'complete'}`}>
            {completeness}%
          </span>
          
          {/* Missing Items Hint */}
          {missingItems.length > 0 && !isExpanded && (
            <span className="section-missing">
              Missing: {missingItems.join(', ')}
            </span>
          )}
          
          {/* Chevron */}
          {isExpanded ? (
            <ChevronDown className="section-chevron" />
          ) : (
            <ChevronRight className="section-chevron" />
          )}
        </div>
      </button>
      
      {/* Section Content (Expanded) */}
      {isExpanded && (
        <div className="section-content">
          {children}
          
          {/* Add CTA if incomplete */}
          {completeness < 100 && (
            <button 
              className="section-add-btn"
              onClick={() => onAddClick?.(section.id)}
              data-testid={`add-${section.id}-btn`}
            >
              <Plus className="w-4 h-4" />
              <span>Add {missingItems[0] || 'more info'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// Soul Profile Content Component
const SoulProfileContent = memo(({ pet, soulData }) => {
  const soulAnswers = pet?.doggy_soul_answers || {};
  const soul = pet?.soul || {};
  
  // Extract personality traits
  const traits = [];
  if (soulAnswers.temperament) traits.push({ label: 'Temperament', value: soulAnswers.temperament, icon: '🎭' });
  if (soulAnswers.general_nature) traits.push({ label: 'Nature', value: soulAnswers.general_nature, icon: '💫' });
  if (soulAnswers.energy_level) traits.push({ label: 'Energy', value: soulAnswers.energy_level, icon: '⚡' });
  if (soulAnswers.play_style) traits.push({ label: 'Play Style', value: soulAnswers.play_style, icon: '🎾' });
  if (soulAnswers.social_with_dogs) traits.push({ label: 'With Dogs', value: soulAnswers.social_with_dogs, icon: '🐕' });
  if (soulAnswers.social_with_people) traits.push({ label: 'With People', value: soulAnswers.social_with_people, icon: '👨‍👩‍👧' });
  if (soul.personality_tag) traits.push({ label: 'Personality', value: soul.personality_tag, icon: '👑' });
  
  return (
    <div className="soul-profile-content">
      {traits.length > 0 ? (
        <div className="soul-traits-grid">
          {traits.map((trait, i) => (
            <div key={i} className="soul-trait-card">
              <span className="trait-icon">{trait.icon}</span>
              <span className="trait-label">{trait.label}</span>
              <span className="trait-value">{Array.isArray(trait.value) ? trait.value.join(', ') : trait.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="soul-empty-state">
          <Sparkles className="w-8 h-8 text-purple-400 mb-2" />
          <p>Help Mira understand {pet?.name || 'your pet'}'s soul</p>
          <p className="text-xs text-gray-400 mt-1">Answer questions to build the personality profile</p>
        </div>
      )}
    </div>
  );
});

// Health Profile Content Component
const HealthProfileContent = memo(({ pet }) => {
  const soulAnswers = pet?.doggy_soul_answers || {};
  const preferences = pet?.preferences || {};
  
  const allergies = preferences.allergies || soulAnswers.food_allergies || [];
  const weight = soulAnswers.weight;
  const spayedNeutered = soulAnswers.spayed_neutered;
  
  const items = [];
  if (allergies && allergies.length > 0 && allergies[0] !== 'No') {
    items.push({ label: 'Allergies', value: Array.isArray(allergies) ? allergies.join(', ') : allergies, icon: '⚠️', critical: true });
  }
  if (weight) items.push({ label: 'Weight', value: weight, icon: '⚖️' });
  if (spayedNeutered) items.push({ label: 'Spayed/Neutered', value: spayedNeutered, icon: '✓' });
  
  return (
    <div className="health-profile-content">
      {items.length > 0 ? (
        <div className="health-items-list">
          {items.map((item, i) => (
            <div key={i} className={`health-item ${item.critical ? 'critical' : ''}`}>
              <span className="health-icon">{item.icon}</span>
              <span className="health-label">{item.label}</span>
              <span className="health-value">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="health-empty-state">
          <Shield className="w-8 h-8 text-red-400 mb-2" />
          <p>No health information added yet</p>
          <p className="text-xs text-gray-400 mt-1">Add allergies, weight, and health records for safer recommendations</p>
        </div>
      )}
    </div>
  );
});

// Diet & Food Content Component
const DietProfileContent = memo(({ pet }) => {
  const soulAnswers = pet?.doggy_soul_answers || {};
  const preferences = pet?.preferences || {};
  
  const items = [];
  
  // Diet type
  const dietType = soulAnswers.diet_type || soulAnswers.food_type || preferences.diet_type;
  if (dietType) items.push({ label: 'Diet Type', value: dietType, icon: '🍽️' });
  
  // Feeding schedule
  const feedingSchedule = soulAnswers.feeding_schedule || preferences.feeding_schedule;
  if (feedingSchedule) items.push({ label: 'Feeding Schedule', value: feedingSchedule, icon: '⏰' });
  
  // Favorite flavors
  const flavors = preferences.favorite_flavors || soulAnswers.favorite_flavors;
  if (flavors && (Array.isArray(flavors) ? flavors.length > 0 : flavors)) {
    items.push({ 
      label: 'Favorite Flavors', 
      value: Array.isArray(flavors) ? flavors.join(', ') : flavors, 
      icon: '❤️' 
    });
  }
  
  // Treat preferences
  const treats = soulAnswers.treat_preferences || preferences.favorite_treats;
  if (treats) {
    items.push({ 
      label: 'Treats', 
      value: Array.isArray(treats) ? treats.join(', ') : treats, 
      icon: '🦴' 
    });
  }
  
  return (
    <div className="diet-profile-content">
      {items.length > 0 ? (
        <div className="diet-items-list">
          {items.map((item, i) => (
            <div key={i} className="diet-item">
              <span className="diet-icon">{item.icon}</span>
              <span className="diet-label">{item.label}</span>
              <span className="diet-value">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="diet-empty-state">
          <Apple className="w-8 h-8 text-orange-400 mb-2" />
          <p>No diet information added yet</p>
          <p className="text-xs text-gray-400 mt-1">Add diet preferences for personalized food recommendations</p>
        </div>
      )}
    </div>
  );
});

// Behaviour & Training Content Component
const BehaviourProfileContent = memo(({ pet }) => {
  const soulAnswers = pet?.doggy_soul_answers || {};
  
  const items = [];
  
  if (soulAnswers.training_level) items.push({ label: 'Training Level', value: soulAnswers.training_level, icon: '🎓' });
  if (soulAnswers.commands_known) {
    const commands = Array.isArray(soulAnswers.commands_known) 
      ? soulAnswers.commands_known.join(', ') 
      : soulAnswers.commands_known;
    items.push({ label: 'Commands Known', value: commands, icon: '✋' });
  }
  if (soulAnswers.leash_behavior) items.push({ label: 'Leash Behavior', value: soulAnswers.leash_behavior, icon: '🔗' });
  if (soulAnswers.behavioral_issues) {
    const issues = Array.isArray(soulAnswers.behavioral_issues) 
      ? soulAnswers.behavioral_issues.join(', ') 
      : soulAnswers.behavioral_issues;
    if (issues && issues.toLowerCase() !== 'none') {
      items.push({ label: 'Working On', value: issues, icon: '🎯' });
    }
  }
  
  return (
    <div className="behaviour-profile-content">
      {items.length > 0 ? (
        <div className="behaviour-items-list">
          {items.map((item, i) => (
            <div key={i} className="behaviour-item">
              <span className="behaviour-icon">{item.icon}</span>
              <span className="behaviour-label">{item.label}</span>
              <span className="behaviour-value">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="behaviour-empty-state">
          <GraduationCap className="w-8 h-8 text-blue-400 mb-2" />
          <p>No training information added yet</p>
          <p className="text-xs text-gray-400 mt-1">Add training details for better activity recommendations</p>
        </div>
      )}
    </div>
  );
});

// Grooming & Care Content Component
const GroomingProfileContent = memo(({ pet }) => {
  const soulAnswers = pet?.doggy_soul_answers || {};
  
  const items = [];
  
  if (soulAnswers.coat_type) items.push({ label: 'Coat Type', value: soulAnswers.coat_type, icon: '✨' });
  if (soulAnswers.grooming_frequency) items.push({ label: 'Grooming Schedule', value: soulAnswers.grooming_frequency, icon: '📅' });
  if (soulAnswers.skin_sensitivity) items.push({ label: 'Skin Sensitivity', value: soulAnswers.skin_sensitivity, icon: '🧴' });
  if (soulAnswers.bath_frequency) items.push({ label: 'Bath Frequency', value: soulAnswers.bath_frequency, icon: '🛁' });
  
  return (
    <div className="grooming-profile-content">
      {items.length > 0 ? (
        <div className="grooming-items-list">
          {items.map((item, i) => (
            <div key={i} className="grooming-item">
              <span className="grooming-icon">{item.icon}</span>
              <span className="grooming-label">{item.label}</span>
              <span className="grooming-value">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grooming-empty-state">
          <Scissors className="w-8 h-8 text-pink-400 mb-2" />
          <p>No grooming information added yet</p>
          <p className="text-xs text-gray-400 mt-1">Add grooming details for spa and care recommendations</p>
        </div>
      )}
    </div>
  );
});

// Routine Tracker Content Component
const RoutineProfileContent = memo(({ pet }) => {
  const soulAnswers = pet?.doggy_soul_answers || {};
  
  const items = [];
  
  if (soulAnswers.walk_frequency) items.push({ label: 'Walk Schedule', value: soulAnswers.walk_frequency, icon: '🚶' });
  if (soulAnswers.exercise_needs) items.push({ label: 'Exercise Needs', value: soulAnswers.exercise_needs, icon: '🏃' });
  if (soulAnswers.sleep_pattern) items.push({ label: 'Sleep Pattern', value: soulAnswers.sleep_pattern, icon: '😴' });
  if (soulAnswers.daily_routine) items.push({ label: 'Daily Routine', value: soulAnswers.daily_routine, icon: '📋' });
  
  return (
    <div className="routine-profile-content">
      {items.length > 0 ? (
        <div className="routine-items-list">
          {items.map((item, i) => (
            <div key={i} className="routine-item">
              <span className="routine-icon">{item.icon}</span>
              <span className="routine-label">{item.label}</span>
              <span className="routine-value">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="routine-empty-state">
          <Calendar className="w-8 h-8 text-green-400 mb-2" />
          <p>No routine information added yet</p>
          <p className="text-xs text-gray-400 mt-1">Track walks, meals, and activities for better insights</p>
        </div>
      )}
    </div>
  );
});

// Documents Vault Content Component  
const DocumentsProfileContent = memo(({ pet }) => {
  const documents = pet?.documents || [];
  const healthVault = pet?.health_vault || {};
  
  // Combine documents from various sources
  const allDocs = [
    ...documents,
    ...(healthVault.vaccination_records || []).map(v => ({ type: 'vaccination', name: v.name || 'Vaccination', date: v.date })),
    ...(healthVault.medical_records || []).map(m => ({ type: 'medical', name: m.name || 'Medical Record', date: m.date })),
  ];
  
  return (
    <div className="documents-profile-content">
      {allDocs.length > 0 ? (
        <div className="documents-list">
          {allDocs.slice(0, 5).map((doc, i) => (
            <div key={i} className="document-item">
              <span className="document-icon">
                {doc.type === 'vaccination' ? '💉' : doc.type === 'medical' ? '🏥' : '📄'}
              </span>
              <span className="document-name">{doc.name}</span>
              {doc.date && (
                <span className="document-date">
                  {new Date(doc.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          ))}
          {allDocs.length > 5 && (
            <div className="documents-more">+{allDocs.length - 5} more documents</div>
          )}
        </div>
      ) : (
        <div className="documents-empty-state">
          <FileText className="w-8 h-8 text-cyan-400 mb-2" />
          <p>No documents uploaded yet</p>
          <p className="text-xs text-gray-400 mt-1">Store vaccination records, insurance, and prescriptions</p>
        </div>
      )}
    </div>
  );
});

// Life Timeline Content Component
const TimelineProfileContent = memo(({ pet }) => {
  const timeline = pet?.timeline || pet?.life_events || [];
  const birthday = pet?.birthday || pet?.dob || pet?.doggy_soul_answers?.dob;
  
  // Create timeline items including birthday
  const timelineItems = [];
  if (birthday) {
    timelineItems.push({
      icon: '🎂',
      title: `${pet?.name}'s Birthday`,
      date: birthday,
      type: 'birthday'
    });
  }
  
  // Add other timeline events
  timeline.forEach(event => {
    timelineItems.push({
      icon: event.icon || '📍',
      title: event.title || event.name,
      date: event.date,
      type: event.type || 'event'
    });
  });
  
  // Sort by date (most recent first)
  timelineItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return (
    <div className="timeline-profile-content">
      {timelineItems.length > 0 ? (
        <div className="timeline-list">
          {timelineItems.slice(0, 5).map((item, i) => (
            <div key={i} className="timeline-item">
              <span className="timeline-icon">{item.icon}</span>
              <div className="timeline-details">
                <span className="timeline-title">{item.title}</span>
                {item.date && (
                  <span className="timeline-date">
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="timeline-empty-state">
          <Clock className="w-8 h-8 text-amber-400 mb-2" />
          <p>No timeline events yet</p>
          <p className="text-xs text-gray-400 mt-1">Add milestones, adoption day, and memorable moments</p>
        </div>
      )}
    </div>
  );
});

// Preferences & Constraints Content Component
const PreferencesProfileContent = memo(({ pet }) => {
  const soulAnswers = pet?.doggy_soul_answers || {};
  const preferences = pet?.preferences || {};
  
  const items = [];
  
  // Likes
  const likes = soulAnswers.likes || preferences.likes;
  if (likes) {
    items.push({ 
      label: 'Likes', 
      value: Array.isArray(likes) ? likes.join(', ') : likes, 
      icon: '💚',
      type: 'positive'
    });
  }
  
  // Dislikes
  const dislikes = soulAnswers.dislikes || preferences.dislikes;
  if (dislikes) {
    items.push({ 
      label: 'Dislikes', 
      value: Array.isArray(dislikes) ? dislikes.join(', ') : dislikes, 
      icon: '🚫',
      type: 'negative'
    });
  }
  
  // Fear triggers
  const fears = soulAnswers.fear_triggers || preferences.fear_triggers;
  if (fears) {
    items.push({ 
      label: 'Fear Triggers', 
      value: Array.isArray(fears) ? fears.join(', ') : fears, 
      icon: '⚡',
      type: 'warning'
    });
  }
  
  // Special needs
  const specialNeeds = soulAnswers.special_needs || preferences.special_needs;
  if (specialNeeds) {
    items.push({ 
      label: 'Special Needs', 
      value: Array.isArray(specialNeeds) ? specialNeeds.join(', ') : specialNeeds, 
      icon: '💜',
      type: 'special'
    });
  }
  
  return (
    <div className="preferences-profile-content">
      {items.length > 0 ? (
        <div className="preferences-list">
          {items.map((item, i) => (
            <div key={i} className={`preferences-item ${item.type}`}>
              <span className="preferences-icon">{item.icon}</span>
              <span className="preferences-label">{item.label}</span>
              <span className="preferences-value">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="preferences-empty-state">
          <Settings className="w-8 h-8 text-gray-400 mb-2" />
          <p>No preferences added yet</p>
          <p className="text-xs text-gray-400 mt-1">Add likes, dislikes, and constraints for personalized experiences</p>
        </div>
      )}
    </div>
  );
});

// Membership & Rewards Component
const MembershipRewards = memo(({ membership, badges, onViewRewards }) => {
  const hasMembership = membership && (membership.tier || membership.paw_points !== undefined);
  
  if (!hasMembership) {
    return (
      <div className="membership-section coming-soon" data-testid="membership-section">
        <div className="membership-header">
          <Crown className="w-5 h-5 text-amber-400" />
          <span className="membership-title">Membership & Rewards</span>
        </div>
        <div className="membership-placeholder">
          <Gift className="w-8 h-8 text-gray-500 mb-2" />
          <p className="text-gray-400">Not connected yet</p>
          <button className="membership-connect-btn" disabled>
            <Wallet className="w-4 h-4" />
            <span>Connect Membership</span>
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="membership-section" data-testid="membership-section">
      <div className="membership-header">
        <Crown className="w-5 h-5 text-amber-400" />
        <span className="membership-title">Membership & Rewards</span>
      </div>
      
      {/* Membership Card */}
      <div className={`membership-card tier-${(membership.tier || 'member').toLowerCase()}`}>
        <div className="membership-card-header">
          <Crown className="w-6 h-6" />
          <span className="membership-tier">{membership.tier || 'Member'}</span>
        </div>
        {membership.member_since && (
          <p className="membership-since">Member since {membership.member_since}</p>
        )}
        <div className="membership-points-display">
          <Star className="w-5 h-5" />
          <span className="points-value">{(membership.paw_points || 0).toLocaleString()}</span>
          <span className="points-label">Paw Points</span>
        </div>
        {membership.next_tier && (
          <p className="membership-next-tier">
            {membership.points_to_next || 500} pts to {membership.next_tier}
          </p>
        )}
        <button 
          className="membership-view-btn"
          onClick={onViewRewards}
          data-testid="view-rewards-btn"
        >
          View Rewards
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      {/* Badges */}
      {badges && badges.length > 0 && (
        <div className="membership-badges">
          <h4 className="badges-title">Badges Earned</h4>
          <div className="badges-grid">
            {badges.slice(0, 4).map((badge, i) => (
              <div key={i} className="badge-item" title={badge.description || badge.name}>
                <span className="badge-icon">{badge.icon || '🏆'}</span>
                <span className="badge-name">{badge.name}</span>
              </div>
            ))}
            {badges.length > 4 && (
              <div className="badge-item more">
                <span className="badge-icon">+{badges.length - 4}</span>
                <span className="badge-name">more</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// Main MOJO Profile Modal Component
const MojoProfileModal = ({
  isOpen,
  onClose,
  pet,
  allPets = [],
  soulScore = 0,
  membership = null,
  badges = [],
  apiUrl,
  token,
  userEmail, // Added: Required for member profile API
  onSwitchPet,
  onEditSection,
  onSoulQuestionClick,
  deepLinkSection = null, // 'soul' to auto-scroll to soul section
}) => {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const soulSectionRef = useRef(null);
  const [expandedSections, setExpandedSections] = useState(['soul']); // Soul default expanded
  const [loading, setLoading] = useState(false);
  const [fullPetData, setFullPetData] = useState(null);
  const [membershipData, setMembershipData] = useState(membership);
  const [badgesData, setBadgesData] = useState(badges);
  const [personalizationStats, setPersonalizationStats] = useState(null);
  const [computedSoulScore, setComputedSoulScore] = useState(soulScore);
  
  // Fetch full pet data on open
  useEffect(() => {
    if (isOpen && pet?.id && apiUrl) {
      fetchFullPetData();
    }
  }, [isOpen, pet?.id, apiUrl]);
  
  // Deep link to soul section
  useEffect(() => {
    if (isOpen && deepLinkSection === 'soul' && soulSectionRef.current) {
      setTimeout(() => {
        soulSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (!expandedSections.includes('soul')) {
          setExpandedSections(prev => [...prev, 'soul']);
        }
      }, 300);
    }
  }, [isOpen, deepLinkSection]);
  
  // Fetch complete pet profile data from all endpoints
  const fetchFullPetData = async () => {
    if (!pet?.id || !apiUrl) return;
    
    setLoading(true);
    console.log('[MOJO] Fetching complete pet profile data for:', pet.name);
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      // Parallel fetch from multiple endpoints for complete data
      const [petResponse, statsResponse, memberResponse] = await Promise.all([
        // 1. Full pet profile with doggy_soul_answers
        fetch(`${apiUrl}/api/pets/${pet.id}`, { headers }).catch(() => null),
        
        // 2. Personalization stats (soul score, knowledge items)
        fetch(`${apiUrl}/api/mira/personalization-stats/${pet.id}`, { headers }).catch(() => null),
        
        // 3. Member profile with membership tier, paw points, badges
        // Note: This endpoint requires user_email query param
        userEmail 
          ? fetch(`${apiUrl}/api/member/profile?user_email=${encodeURIComponent(userEmail)}`, { headers }).catch(() => null)
          : fetch(`${apiUrl}/api/member/profile`, { headers }).catch(() => null)
      ]);
      
      // Process pet data
      if (petResponse?.ok) {
        const petData = await petResponse.json();
        console.log('[MOJO] Pet data loaded:', petData.name, 'Score:', petData.overall_score);
        setFullPetData(petData);
        
        // Use actual soul score from API
        if (petData.overall_score !== undefined) {
          setComputedSoulScore(Math.round(petData.overall_score));
        }
      }
      
      // Process personalization stats
      if (statsResponse?.ok) {
        const statsData = await statsResponse.json();
        console.log('[MOJO] Personalization stats loaded:', statsData.soul_score);
        setPersonalizationStats(statsData);
        
        // Override soul score from personalization stats if available
        if (statsData.soul_score !== undefined) {
          setComputedSoulScore(Math.round(statsData.soul_score));
        }
      }
      
      // Process member profile data
      if (memberResponse?.ok) {
        const memberData = await memberResponse.json();
        console.log('[MOJO] Member data loaded:', memberData.membership_tier, 'Pets:', memberData.pets?.length);
        
        // Extract membership info
        const membershipInfo = {
          tier: memberData.membership_tier || 'Member',
          paw_points: memberData.paw_points || 0,
          member_since: memberData.created_at 
            ? new Date(memberData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : null,
          expires: memberData.membership_expires,
          next_tier: getNextTier(memberData.membership_tier),
          points_to_next: calculatePointsToNextTier(memberData.paw_points, memberData.membership_tier)
        };
        setMembershipData(membershipInfo);
        
        // Extract badges from member data
        if (memberData.badges && Array.isArray(memberData.badges)) {
          setBadgesData(memberData.badges);
        }
        
        // Find matching pet in member data for enhanced info
        const memberPet = memberData.pets?.find(p => 
          p.name?.toLowerCase() === pet.name?.toLowerCase()
        );
        if (memberPet) {
          console.log('[MOJO] Found pet in member data with enhanced info');
          // Merge any additional data from member profile
          setFullPetData(prev => ({
            ...prev,
            ...memberPet,
            // Preserve doggy_soul_answers from the original pet data
            doggy_soul_answers: prev?.doggy_soul_answers || {},
            // Add soul traits from member data
            soul_traits: memberPet.soul_traits || prev?.soul_traits,
            sensitivities: memberPet.sensitivities || prev?.sensitivities || [],
            favorites: memberPet.favorites || prev?.favorites || []
          }));
          
          // Use soul score from member pet data if available
          if (memberPet.soul_score !== undefined) {
            setComputedSoulScore(Math.round(memberPet.soul_score));
          }
        }
      }
      
    } catch (err) {
      console.error('[MOJO] Error fetching pet data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper: Calculate next membership tier
  const getNextTier = (currentTier) => {
    const tiers = ['member', 'pawsome', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf((currentTier || '').toLowerCase());
    if (currentIndex >= 0 && currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1].charAt(0).toUpperCase() + tiers[currentIndex + 1].slice(1);
    }
    return null;
  };
  
  // Helper: Calculate points needed for next tier
  const calculatePointsToNextTier = (currentPoints, currentTier) => {
    const tierThresholds = {
      'member': 500,
      'pawsome': 1500,
      'gold': 5000,
      'platinum': null // Top tier
    };
    const nextThreshold = tierThresholds[(currentTier || '').toLowerCase()];
    if (nextThreshold && currentPoints < nextThreshold) {
      return nextThreshold - currentPoints;
    }
    return null;
  };
  
  // Toggle section expansion
  const toggleSection = useCallback((sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  }, []);
  
  // Handle add/edit click for a section
  const handleAddClick = useCallback((sectionId) => {
    hapticFeedback.buttonTap();
    if (onEditSection) {
      onEditSection(sectionId);
    } else if (sectionId === 'soul') {
      onSoulQuestionClick?.();
    } else {
      // Navigate to my-pets page with section focus
      navigate(`/my-pets?pet=${pet?.id}&section=${sectionId}`);
    }
  }, [pet?.id, onEditSection, onSoulQuestionClick, navigate]);
  
  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      hapticFeedback.buttonTap();
      onClose();
    }
  }, [onClose]);
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const petData = fullPetData || pet;
  
  return (
    <div 
      className="mojo-modal-backdrop"
      onClick={handleBackdropClick}
      data-testid="mojo-profile-modal"
    >
      <div 
        className="mojo-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="mojo-header">
          <button 
            className="mojo-back-btn"
            onClick={() => {
              hapticFeedback.buttonTap();
              onClose();
            }}
            data-testid="mojo-close-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="mojo-title">MOJO</h2>
          <button 
            className="mojo-edit-btn"
            onClick={() => handleAddClick('details')}
            data-testid="mojo-edit-btn"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="mojo-loading">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <span>Loading {pet?.name}'s profile...</span>
          </div>
        )}
        
        {/* Modal Content */}
        {!loading && (
          <div className="mojo-content">
            {/* Pet Snapshot (Always Visible) */}
            <PetSnapshot 
              pet={petData}
              soulScore={computedSoulScore}
              membership={membershipData}
              onEditClick={handleAddClick}
              onSwitchPet={onSwitchPet}
              apiUrl={apiUrl}
            />
            
            {/* Profile Sections (Accordion) */}
            <div className="mojo-sections">
              {PROFILE_SECTIONS.map((section) => {
                const completeness = calculateSectionCompleteness(section.id, petData);
                const missingItems = getMissingItems(section.id, petData);
                const isExpanded = expandedSections.includes(section.id);
                
                return (
                  <div 
                    key={section.id}
                    ref={section.id === 'soul' ? soulSectionRef : null}
                  >
                    <SectionRow
                      section={section}
                      completeness={completeness}
                      missingItems={missingItems}
                      isExpanded={isExpanded}
                      onToggle={toggleSection}
                      onAddClick={handleAddClick}
                    >
                      {/* Section-specific content */}
                      {section.id === 'soul' && <SoulProfileContent pet={petData} />}
                      {section.id === 'health' && <HealthProfileContent pet={petData} />}
                      {section.id === 'diet' && <DietProfileContent pet={petData} />}
                      {section.id === 'behaviour' && <BehaviourProfileContent pet={petData} />}
                      {section.id === 'grooming' && <GroomingProfileContent pet={petData} />}
                      {section.id === 'routine' && <RoutineProfileContent pet={petData} />}
                      {section.id === 'documents' && <DocumentsProfileContent pet={petData} />}
                      {section.id === 'timeline' && <TimelineProfileContent pet={petData} />}
                      {section.id === 'preferences' && <PreferencesProfileContent pet={petData} />}
                    </SectionRow>
                  </div>
                );
              })}
            </div>
            
            {/* Membership & Rewards */}
            <MembershipRewards 
              membership={membershipData}
              badges={badgesData}
              onViewRewards={() => navigate('/dashboard?tab=rewards')}
            />
            
            {/* Proactive Questions CTA */}
            {computedSoulScore < 80 && (
              <button 
                className="mojo-grow-soul-btn"
                onClick={() => {
                  hapticFeedback.buttonTap();
                  onClose();
                  onSoulQuestionClick?.();
                }}
                data-testid="grow-soul-btn"
              >
                <Sparkles className="w-5 h-5" />
                <span>Help Mira know {petData?.name || 'your pet'} better</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Styles */}
      <style jsx>{`
        .mojo-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
        }
        
        .mojo-modal {
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          background: linear-gradient(180deg, #1a1025 0%, #0d0a12 100%);
          border-radius: 24px 24px 0 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        /* Mobile: Full screen */
        @media (max-width: 640px) {
          .mojo-modal {
            max-width: 100%;
            max-height: 100%;
            height: 100%;
            border-radius: 0;
          }
        }
        
        /* Header */
        .mojo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
          background: rgba(26, 16, 37, 0.95);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        
        .mojo-back-btn, .mojo-edit-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.1);
          color: #a78bfa;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mojo-back-btn:hover, .mojo-edit-btn:hover {
          background: rgba(139, 92, 246, 0.2);
        }
        
        .mojo-title {
          font-size: 18px;
          font-weight: 700;
          color: white;
          letter-spacing: 2px;
        }
        
        /* Loading */
        .mojo-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 12px;
          color: #a78bfa;
        }
        
        /* Content */
        .mojo-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
        
        /* Pet Snapshot */
        .mojo-snapshot {
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.05));
          border-bottom: 1px solid rgba(139, 92, 246, 0.2);
        }
        
        .snapshot-photo-container {
          position: relative;
        }
        
        .snapshot-photo-ring {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .snapshot-photo {
          width: 108px;
          height: 108px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #1a1025;
        }
        
        .snapshot-photo-placeholder {
          width: 108px;
          height: 108px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2d1f42, #1a1025);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #1a1025;
        }
        
        .snapshot-photo-edit {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #8B5CF6;
          color: white;
          border: 2px solid #1a1025;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        
        .snapshot-info {
          text-align: center;
        }
        
        .snapshot-name {
          font-size: 28px;
          font-weight: 700;
          color: white;
          margin: 0;
        }
        
        .snapshot-details {
          font-size: 14px;
          color: #a78bfa;
          margin: 4px 0 0;
        }
        
        .snapshot-location {
          font-size: 12px;
          color: #6b7280;
          margin: 4px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .snapshot-soul-score {
          margin: 8px 0;
        }
        
        .soul-score-circle {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 24px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2));
          border-radius: 20px;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }
        
        .soul-score-value {
          font-size: 32px;
          font-weight: 800;
          color: white;
          line-height: 1;
        }
        
        .soul-score-label {
          font-size: 10px;
          color: #a78bfa;
          letter-spacing: 1px;
          margin-top: 2px;
        }
        
        .snapshot-membership {
          display: flex;
          gap: 12px;
        }
        
        .membership-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .membership-badge.tier-gold {
          background: linear-gradient(135deg, #F59E0B, #D97706);
          color: white;
        }
        
        .membership-badge.tier-silver {
          background: linear-gradient(135deg, #9CA3AF, #6B7280);
          color: white;
        }
        
        .membership-badge.tier-platinum {
          background: linear-gradient(135deg, #E5E7EB, #9CA3AF);
          color: #1F2937;
        }
        
        .membership-points {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
        }
        
        .snapshot-actions {
          display: flex;
          gap: 12px;
        }
        
        .snapshot-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: #a78bfa;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .snapshot-action-btn:hover {
          background: rgba(139, 92, 246, 0.2);
        }
        
        /* Sections */
        .mojo-sections {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .mojo-section {
          border-radius: 16px;
          overflow: hidden;
        }
        
        .section-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border: 1px solid;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
        }
        
        .mojo-section.expanded .section-header {
          border-radius: 16px 16px 0 0;
        }
        
        .section-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .section-icon {
          width: 20px;
          height: 20px;
        }
        
        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: white;
        }
        
        .section-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .section-completeness {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 8px;
        }
        
        .section-completeness.empty {
          background: rgba(239, 68, 68, 0.2);
          color: #FCA5A5;
        }
        
        .section-completeness.low {
          background: rgba(245, 158, 11, 0.2);
          color: #FCD34D;
        }
        
        .section-completeness.medium {
          background: rgba(59, 130, 246, 0.2);
          color: #93C5FD;
        }
        
        .section-completeness.complete {
          background: rgba(34, 197, 94, 0.2);
          color: #86EFAC;
        }
        
        .section-missing {
          font-size: 11px;
          color: #9CA3AF;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        @media (max-width: 400px) {
          .section-missing {
            display: none;
          }
        }
        
        .section-chevron {
          width: 18px;
          height: 18px;
          color: #6B7280;
          transition: transform 0.2s;
        }
        
        .mojo-section.expanded .section-chevron {
          transform: rotate(180deg);
        }
        
        /* Section Content */
        .section-content {
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.1);
          border-top: none;
          border-radius: 0 0 16px 16px;
        }
        
        .section-add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          margin-top: 12px;
          border-radius: 12px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px dashed rgba(139, 92, 246, 0.3);
          color: #a78bfa;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .section-add-btn:hover {
          background: rgba(139, 92, 246, 0.2);
          border-style: solid;
        }
        
        .section-placeholder {
          padding: 20px;
          text-align: center;
        }
        
        /* Soul Profile Content */
        .soul-profile-content {
          padding: 8px 0;
        }
        
        .soul-traits-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        @media (max-width: 360px) {
          .soul-traits-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .soul-trait-card {
          display: flex;
          flex-direction: column;
          padding: 12px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
        
        .trait-icon {
          font-size: 20px;
          margin-bottom: 4px;
        }
        
        .trait-label {
          font-size: 10px;
          color: #9CA3AF;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .trait-value {
          font-size: 14px;
          color: white;
          font-weight: 500;
          margin-top: 2px;
        }
        
        .soul-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          text-align: center;
          color: #a78bfa;
        }
        
        /* Health Profile Content */
        .health-profile-content {
          padding: 8px 0;
        }
        
        .health-items-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .health-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(239, 68, 68, 0.1);
        }
        
        .health-item.critical {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
        }
        
        .health-icon {
          font-size: 18px;
        }
        
        .health-label {
          font-size: 12px;
          color: #9CA3AF;
          min-width: 80px;
        }
        
        .health-value {
          font-size: 14px;
          color: white;
          font-weight: 500;
        }
        
        .health-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          text-align: center;
          color: #FCA5A5;
        }
        
        /* Membership Section */
        .membership-section {
          margin: 16px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05));
          border-radius: 20px;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        
        .membership-section.coming-soon {
          background: rgba(107, 114, 128, 0.1);
          border-color: rgba(107, 114, 128, 0.2);
        }
        
        .membership-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .membership-title {
          font-size: 16px;
          font-weight: 600;
          color: white;
        }
        
        .membership-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          text-align: center;
        }
        
        .membership-connect-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding: 10px 20px;
          border-radius: 12px;
          background: rgba(107, 114, 128, 0.2);
          border: none;
          color: #9CA3AF;
          font-size: 14px;
          cursor: not-allowed;
        }
        
        .membership-card {
          padding: 20px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.1));
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        
        .membership-card.tier-gold {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.15));
        }
        
        .membership-card.tier-platinum {
          background: linear-gradient(135deg, rgba(229, 231, 235, 0.2), rgba(156, 163, 175, 0.1));
          border-color: rgba(229, 231, 235, 0.3);
        }
        
        .membership-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #FCD34D;
        }
        
        .membership-tier {
          font-size: 20px;
          font-weight: 700;
        }
        
        .membership-since {
          font-size: 12px;
          color: #9CA3AF;
          margin-top: 4px;
        }
        
        .membership-points-display {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          color: white;
        }
        
        .points-value {
          font-size: 28px;
          font-weight: 700;
        }
        
        .points-label {
          font-size: 12px;
          color: #9CA3AF;
        }
        
        .membership-next-tier {
          font-size: 12px;
          color: #FCD34D;
          margin-top: 8px;
        }
        
        .membership-view-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          width: 100%;
          margin-top: 16px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(245, 158, 11, 0.2);
          border: none;
          color: #FCD34D;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .membership-view-btn:hover {
          background: rgba(245, 158, 11, 0.3);
        }
        
        .membership-badges {
          margin-top: 20px;
        }
        
        .badges-title {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
        }
        
        .badges-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .badge-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          min-width: 64px;
          background: rgba(139, 92, 246, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
        
        .badge-icon {
          font-size: 24px;
        }
        
        .badge-name {
          font-size: 10px;
          color: #9CA3AF;
          margin-top: 4px;
          text-align: center;
        }
        
        .badge-item.more {
          background: rgba(107, 114, 128, 0.1);
          border-color: rgba(107, 114, 128, 0.2);
        }
        
        /* Grow Soul Button */
        .mojo-grow-soul-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 16px;
          padding: 16px 20px;
          border-radius: 16px;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          border: none;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .mojo-grow-soul-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
        }
      `}</style>
    </div>
  );
};

export default MojoProfileModal;
