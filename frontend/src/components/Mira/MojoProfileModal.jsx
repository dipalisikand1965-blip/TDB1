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
  Crown, Star, Gift, Wallet, Plus, Pencil, Home, MessageSquare, AlertTriangle
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';
import {
  SoulProfileEditor,
  HealthProfileEditor,
  DietProfileEditor,
  BehaviourProfileEditor,
  GroomingProfileEditor,
  RoutineProfileEditor,
  PreferencesProfileEditor,
  EnvironmentProfileEditor,
  TimelineEventEditor,
  BasicDetailsEditor,
  editorStyles
} from './MojoSectionEditors';
import TraitGraphVisualization from './TraitGraphVisualization';
import ConflictResolutionCard from './ConflictResolutionCard';

// Section configuration with icons and labels
const PROFILE_SECTIONS = [
  { id: 'soul', icon: Heart, label: 'Soul Profile', color: 'purple', defaultOpen: true },
  { id: 'learned', icon: Sparkles, label: 'What Mira Learned', color: 'emerald', isSpecial: true },
  { id: 'trait_graph', icon: Brain, label: 'Mira\'s Intelligence', color: 'violet', isSpecial: true },
  { id: 'health', icon: Shield, label: 'Health Vault', color: 'red' },
  { id: 'diet', icon: Apple, label: 'Diet & Food', color: 'orange' },
  { id: 'behaviour', icon: GraduationCap, label: 'Behaviour & Training', color: 'blue' },
  { id: 'grooming', icon: Scissors, label: 'Grooming & Care', color: 'pink' },
  { id: 'routine', icon: Calendar, label: 'Routine Tracker', color: 'green' },
  { id: 'environment', icon: Home, label: 'Environment', color: 'teal' },
  { id: 'documents', icon: FileText, label: 'Documents Vault', color: 'cyan' },
  { id: 'timeline', icon: Clock, label: 'Life Timeline', color: 'amber' },
  { id: 'preferences', icon: Settings, label: 'Preferences & Constraints', color: 'gray' },
];

// Color mapping for sections
const SECTION_COLORS = {
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', icon: 'text-purple-400' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', icon: 'text-violet-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: 'text-emerald-400' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: 'text-orange-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: 'text-blue-400' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', icon: 'text-pink-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: 'text-green-400' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', icon: 'text-teal-400' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: 'text-cyan-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
  gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', icon: 'text-gray-400' },
};

// Calculate section completeness from real data
const calculateSectionCompleteness = (sectionId, data) => {
  const soulAnswers = data?.doggy_soul_answers || {};
  const preferences = data?.preferences || {};
  const soul = data?.soul || {};
  const soulMeta = data?.doggy_soul_meta || {};
  
  switch (sectionId) {
    case 'soul': {
      // Soul fields: personality, temperament, energy_level, social_style, anxiety, comfort_preferences
      const soulFields = ['temperament', 'general_nature', 'energy_level', 'play_style', 'social_with_dogs', 
        'social_with_people', 'confidence_level', 'anxiety_triggers', 'comfort_preferences'];
      const filled = soulFields.filter(f => soulAnswers[f] && soulAnswers[f] !== 'Unknown').length;
      return Math.round((filled / soulFields.length) * 100);
    }
    case 'learned': {
      // Learned facts from conversations AND ticket enrichment
      const factsCount = (data?.learned_facts || []).length;
      // Count ticket-derived learnings
      const soulAnswers = data?.doggy_soul_answers || {};
      const ticketCount = (soulAnswers.food_allergies_from_tickets?.length || 0) +
                         (soulAnswers.preferences_from_tickets?.length || 0) +
                         (soulAnswers.anxiety_triggers_from_tickets?.length || 0) +
                         (soulAnswers.grooming_notes_from_tickets?.length || 0);
      const totalCount = factsCount + ticketCount;
      if (totalCount >= 10) return 100;
      if (totalCount >= 5) return 70;
      if (totalCount >= 1) return 40;
      return 0;
    }
    case 'trait_graph': {
      // Trait graph completeness based on number of traits with meta data
      const metaCount = Object.keys(soulMeta).length;
      if (metaCount >= 20) return 100;
      if (metaCount >= 15) return 85;
      if (metaCount >= 10) return 70;
      if (metaCount >= 5) return 50;
      return metaCount > 0 ? 30 : 0;
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
    case 'environment': {
      // Environment: city, home_type, living_space, family_structure, other_pets
      const envFields = ['city', 'home_type', 'living_space', 'family_structure', 'other_pets', 'climate'];
      const filled = envFields.filter(f => {
        const val = data?.[f] || soulAnswers[f] || preferences[f];
        return val && val !== 'Unknown' && val !== '' && (!Array.isArray(val) || val.length > 0);
      }).length;
      // Also check city from pet profile
      const cityFilled = data?.city ? 1 : 0;
      return Math.round(((filled + cityFilled) / (envFields.length + 1)) * 100);
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
  const soulMeta = data?.doggy_soul_meta || {};
  const missing = [];
  
  switch (sectionId) {
    case 'soul':
      if (!soulAnswers.temperament && !soulAnswers.general_nature) missing.push('temperament');
      if (!soulAnswers.energy_level) missing.push('energy level');
      if (!soulAnswers.play_style) missing.push('play style');
      break;
    case 'learned':
      // Learned facts grow from conversations - no missing items
      break;
    case 'trait_graph':
      // Trait graph grows organically - no missing items, just encouragement
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
    case 'environment':
      if (!data?.city && !soulAnswers.city) missing.push('location');
      if (!soulAnswers.home_type) missing.push('home type');
      if (!soulAnswers.other_pets) missing.push('other pets info');
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
                e.target.style.display='none';
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
  onEditClick,
  isEditing,
  children 
}) => {
  const colors = SECTION_COLORS[section.color];
  const Icon = section.icon;
  const isReadOnly = section.isSpecial || section.id === 'trait_graph'; // No edit for special sections
  
  return (
    <div 
      className={`mojo-section ${isExpanded ? 'expanded' : ''} ${isEditing ? 'editing' : ''}`}
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
          
          {/* Action buttons row - only show for editable sections */}
          {!isReadOnly && (
            <div className="section-actions-row">
              {/* Edit button - always show when expanded */}
              <button 
                className="section-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  hapticFeedback.buttonTap();
                  onEditClick?.(section.id);
                }}
                data-testid={`edit-${section.id}-btn`}
              >
                <Pencil className="w-4 h-4" />
                <span>Edit</span>
              </button>
              
              {/* Add CTA if incomplete */}
              {completeness < 100 && (
                <button 
                  className="section-add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddClick?.(section.id);
                  }}
                  data-testid={`add-${section.id}-btn`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {missingItems[0] || 'more info'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Helper: Get trait metadata (confidence + source)
// Direct answers = 100% confidence, Chat-inferred = 75-90%, Pillar-derived = 85%
const getTraitMetadata = (key, soulAnswers, soulMeta) => {
  const meta = soulMeta?.[key] || {};
  const source = meta.source || 'direct';
  
  // Calculate confidence based on source
  let confidence = 100;
  if (source === 'mira' || source === 'chat') {
    confidence = meta.confidence || 85; // Chat-inferred: 75-90%
  } else if (source.startsWith('pillar_')) {
    confidence = meta.confidence || 90; // From pillar interactions
  } else {
    confidence = 100; // Direct answer = 100%
  }
  
  return {
    confidence,
    source,
    isInferred: source === 'mira' || source === 'chat',
    timestamp: meta.captured_at || meta.updated_at
  };
};

// Trait Badge Component - Shows confidence and source
const TraitBadge = memo(({ confidence, isInferred }) => {
  if (!isInferred && confidence === 100) return null;
  
  return (
    <div className="trait-meta">
      {isInferred && (
        <span className="trait-source-badge mira-learned" title="Mira learned this from your conversations">
          <Brain className="w-3 h-3" />
          <span>Mira learned</span>
        </span>
      )}
      {confidence < 100 && (
        <span className={`trait-confidence ${confidence >= 85 ? 'high' : confidence >= 70 ? 'medium' : 'low'}`}>
          {confidence}%
        </span>
      )}
    </div>
  );
});

// Learned Facts Content Component - Shows what Mira learned from conversations
const LearnedFactsContent = memo(({ pet, apiUrl, token, onInsightAction }) => {
  const [processingId, setProcessingId] = useState(null);
  const [showPending, setShowPending] = useState(true);
  const [conflictRefreshKey, setConflictRefreshKey] = useState(0);
  
  const learnedFacts = pet?.learned_facts || [];
  const conversationInsights = pet?.conversation_insights || [];
  
  // ============================================
  // TICKET-DERIVED LEARNINGS (from resolved service requests)
  // Fields: food_allergies_from_tickets, preferences_from_tickets, 
  //         anxiety_triggers_from_tickets, grooming_notes_from_tickets
  // ============================================
  const soulAnswers = pet?.doggy_soul_answers || {};
  const ticketLearnings = [];
  
  // Extract ticket-derived learnings into displayable format
  if (soulAnswers.food_allergies_from_tickets?.length) {
    soulAnswers.food_allergies_from_tickets.forEach(item => {
      ticketLearnings.push({ 
        category: 'health', 
        content: `Allergic to ${item}`, 
        source: 'service_request',
        icon: '⚠️'
      });
    });
  }
  if (soulAnswers.preferences_from_tickets?.length) {
    soulAnswers.preferences_from_tickets.forEach(item => {
      ticketLearnings.push({ 
        category: 'loves', 
        content: `Loves ${item}`, 
        source: 'service_request',
        icon: '❤️'
      });
    });
  }
  if (soulAnswers.anxiety_triggers_from_tickets?.length) {
    soulAnswers.anxiety_triggers_from_tickets.forEach(item => {
      ticketLearnings.push({ 
        category: 'anxiety', 
        content: `Gets scared of ${item}`, 
        source: 'service_request',
        icon: '😰'
      });
    });
  }
  if (soulAnswers.grooming_notes_from_tickets?.length) {
    soulAnswers.grooming_notes_from_tickets.forEach(item => {
      ticketLearnings.push({ 
        category: 'preferences', 
        content: item, 
        source: 'service_request',
        icon: '✂️'
      });
    });
  }
  
  const hasTicketLearnings = ticketLearnings.length > 0;
  
  // Group facts by category
  const groupedFacts = learnedFacts.reduce((acc, fact) => {
    const cat = fact.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(fact);
    return acc;
  }, {});
  
  // Pending insights
  const pendingInsights = conversationInsights.filter(i => i.status === 'pending_review');
  const pendingCount = pendingInsights.length;
  
  // Handle confirm/reject
  const handleInsightAction = async (insightId, action) => {
    setProcessingId(insightId);
    try {
      // Route is at /api/os/concierge/insights/{pet_id}/review
      const response = await fetch(
        `${apiUrl}/api/os/concierge/insights/${pet.id}/review?insight_id=${insightId}&action=${action}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        console.log(`[MOJO] Insight ${action}ed:`, result);
        
        // Handle duplicate case
        if (result.duplicate) {
          console.log(`[MOJO] Duplicate insight skipped`);
        }
        
        // Handle conflict case - trigger conflict refresh
        if (result.has_conflict) {
          console.log(`[MOJO] Conflict detected for entity: ${result.conflict_entity}`);
          setConflictRefreshKey(prev => prev + 1);
        }
        
        // Notify parent to refresh pet data (even for duplicates, to update pending list)
        onInsightAction?.(action, insightId);
      } else {
        const errorText = await response.text();
        console.error('Failed to process insight:', response.status, errorText);
      }
    } catch (error) {
      console.error('Failed to process insight:', error);
    } finally {
      setProcessingId(null);
    }
  };
  
  // Category icons and labels
  const categoryConfig = {
    fears: { icon: '😰', label: 'Fears & Anxieties', color: 'text-red-400' },
    loves: { icon: '❤️', label: 'Loves & Favorites', color: 'text-pink-400' },
    anxiety: { icon: '😟', label: 'Anxiety Triggers', color: 'text-amber-400' },
    behavior: { icon: '🐕', label: 'Behaviors', color: 'text-blue-400' },
    preferences: { icon: '⭐', label: 'Preferences', color: 'text-purple-400' },
    health: { icon: '💊', label: 'Health Notes', color: 'text-green-400' },
    other: { icon: '📝', label: 'Other', color: 'text-gray-400' }
  };
  
  if (learnedFacts.length === 0) {
    const petName = pet?.name || 'your pet';
    return (
      <div className="mojo-section-empty" style={{ textAlign: 'center', padding: '28px 16px' }}>
        <div style={{ 
          width: 56, height: 56, margin: '0 auto 16px', 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(139, 92, 246, 0.2))', 
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Sparkles size={28} className="text-emerald-400" />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
          Mira hasn't learned enough about {petName} yet
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20, maxWidth: 280, margin: '0 auto 20px' }}>
          The more you chat, the smarter Mira gets about {petName}'s needs
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              // Close modal and navigate to chat
              window.dispatchEvent(new CustomEvent('mojo-action', { detail: { action: 'teach-mira' } }));
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: 'white', fontSize: 13, fontWeight: 600,
              borderRadius: 10, border: 'none', cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Brain size={16} />
            Teach Mira
          </button>
          <button
            onClick={() => {
              // Navigate to chat with save prompt
              window.dispatchEvent(new CustomEvent('mojo-action', { detail: { action: 'save-from-chat' } }));
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500,
              borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <MessageSquare size={16} />
            Save from chat
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="mojo-learned-facts" style={{ padding: '12px 0' }}>
      {/* Conflict Resolution Cards - Show at TOP for safety-critical issues */}
      <ConflictResolutionCard 
        pet={pet}
        apiUrl={apiUrl}
        token={token}
        onConflictResolved={(entity, resolution) => {
          console.log(`[MOJO] Conflict resolved: ${entity} -> ${resolution}`);
          setConflictRefreshKey(prev => prev + 1);
          // Refresh pet data to update tags
          onInsightAction?.('conflict_resolved', entity);
        }}
        key={`conflicts-${conflictRefreshKey}`}
      />
      
      {/* Pending Insights - Review & Confirm Section */}
      {pendingCount > 0 && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setShowPending(!showPending)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 12px', marginBottom: showPending ? 12 : 0,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 10, cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={18} className="text-emerald-400" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'white', flex: 1, textAlign: 'left' }}>
              {pendingCount} New Insight{pendingCount > 1 ? 's' : ''} to Review
            </span>
            <ChevronDown 
              size={18} 
              style={{ 
                color: 'rgba(255,255,255,0.6)',
                transform: showPending ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} 
            />
          </button>
          
          {showPending && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingInsights.map((insight) => {
                const config = categoryConfig[insight.category] || categoryConfig.other;
                const isProcessing = processingId === insight.id;
                
                return (
                  <div 
                    key={insight.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      opacity: isProcessing ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: 16, marginTop: 2 }}>{config.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.9)',
                        lineHeight: 1.4
                      }}>
                        {insight.content}
                      </p>
                      <p style={{ 
                        margin: '4px 0 0', fontSize: 11, 
                        color: 'rgba(255,255,255,0.4)' 
                      }}>
                        From conversation • {new Date(insight.extracted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleInsightAction(insight.id, 'confirm')}
                        disabled={isProcessing}
                        style={{
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          color: 'white', fontSize: 12, fontWeight: 600,
                          borderRadius: 6, border: 'none', cursor: isProcessing ? 'wait' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4
                        }}
                        data-testid={`confirm-insight-${insight.id}`}
                      >
                        <Check size={14} />
                        Confirm
                      </button>
                      <button
                        onClick={() => handleInsightAction(insight.id, 'reject')}
                        disabled={isProcessing}
                        style={{
                          padding: '6px 10px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444', fontSize: 12, fontWeight: 500,
                          borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.3)', 
                          cursor: isProcessing ? 'wait' : 'pointer'
                        }}
                        data-testid={`reject-insight-${insight.id}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Confirmed Facts Section */}
      {learnedFacts.length > 0 && (
        <>
          {pendingCount > 0 && (
            <div style={{ 
              fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
              marginBottom: 12, paddingLeft: 4
            }}>
              CONFIRMED
            </div>
          )}
          
          {/* Grouped Facts */}
          {Object.entries(groupedFacts).map(([category, facts]) => {
            const config = categoryConfig[category] || categoryConfig.other;
            return (
              <div key={category} style={{ marginBottom: 16 }}>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: 6, 
                  marginBottom: 8, paddingLeft: 4 
                }}>
                  <span style={{ fontSize: 14 }}>{config.icon}</span>
                  <span className={config.color} style={{ fontSize: 12, fontWeight: 500 }}>
                    {config.label}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {facts.map((fact, idx) => {
                    // Check if fact is suppressed (health conflict)
                    const isSuppressed = fact.is_active === false || fact.suppressed_reason;
                    const hasConflict = fact.has_conflict || fact.conflict_status === 'pending_resolution';
                    
                    return (
                      <span 
                        key={fact.id || idx}
                        title={isSuppressed 
                          ? `Hidden due to health restriction. Safety takes priority.` 
                          : hasConflict 
                            ? `Conflict detected - please resolve above`
                            : null
                        }
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '6px 10px',
                          background: isSuppressed 
                            ? 'rgba(239, 68, 68, 0.1)' 
                            : hasConflict 
                              ? 'rgba(251, 191, 36, 0.1)'
                              : 'rgba(255,255,255,0.05)',
                          border: isSuppressed 
                            ? '1px solid rgba(239, 68, 68, 0.3)' 
                            : hasConflict
                              ? '1px solid rgba(251, 191, 36, 0.3)'
                              : '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 20,
                          fontSize: 13,
                          color: isSuppressed 
                            ? 'rgba(255,255,255,0.4)' 
                            : 'rgba(255,255,255,0.8)',
                          textDecoration: isSuppressed ? 'line-through' : 'none',
                          opacity: isSuppressed ? 0.6 : 1
                        }}
                      >
                        {isSuppressed && <Shield size={12} className="text-red-400" />}
                        {hasConflict && !isSuppressed && <AlertTriangle size={12} className="text-amber-400" />}
                        {fact.content}
                        {!isSuppressed && !hasConflict && (
                          <Check size={12} className="text-emerald-400" style={{ marginLeft: 2 }} />
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
      
      {/* Empty state when no facts at all */}
      {learnedFacts.length === 0 && pendingCount === 0 && !hasTicketLearnings && (
        <div className="mojo-section-empty" style={{ textAlign: 'center', padding: '8px 16px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
            No confirmed learnings yet. Chat with Mira to teach her about {pet?.name || 'your pet'}!
          </p>
        </div>
      )}
      
      {/* ============================================
          TICKET-DERIVED LEARNINGS SECTION
          Highlighted with Concierge® badge
          ============================================ */}
      {hasTicketLearnings && (
        <div style={{ marginTop: 16, marginBottom: 12 }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 12, paddingLeft: 4 
          }}>
            <span style={{ 
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              color: 'white',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              From Service Requests
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              Learned from Concierge®
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ticketLearnings.map((learning, idx) => (
              <span 
                key={`ticket-${idx}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '6px 10px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.1))',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: 20,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.9)'
                }}
                data-testid={`ticket-learning-${idx}`}
              >
                <span style={{ fontSize: 12 }}>{learning.icon}</span>
                {learning.content}
                <span style={{ 
                  fontSize: 10, 
                  color: '#8B5CF6',
                  marginLeft: 4 
                }}>
                  ✓
                </span>
              </span>
            ))}
          </div>
          {soulAnswers.last_ticket_enrichment && (
            <div style={{ 
              marginTop: 8, 
              fontSize: 10, 
              color: 'rgba(255,255,255,0.35)',
              paddingLeft: 4
            }}>
              Last updated: {new Date(soulAnswers.last_ticket_enrichment).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
      
      {/* Source Attribution */}
      {(learnedFacts.length > 0 || pendingCount > 0 || hasTicketLearnings) && (
        <div style={{ 
          marginTop: 16, paddingTop: 12, 
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: 11, color: 'rgba(255,255,255,0.4)'
        }}>
          <Sparkles size={10} style={{ display: 'inline', marginRight: 4 }} />
          Learned from your conversations with Mira & Service Requests
        </div>
      )}
    </div>
  );
});

// Soul Profile Content Component
const SoulProfileContent = memo(({ pet, soulData }) => {
  const soulAnswers = pet?.doggy_soul_answers || {};
  const soulMeta = pet?.doggy_soul_meta || {}; // Metadata for each answer
  const soul = pet?.soul || {};
  
  // Extract personality traits with metadata
  const traits = [];
  
  const addTrait = (key, label, icon, value) => {
    if (value) {
      const meta = getTraitMetadata(key, soulAnswers, soulMeta);
      traits.push({ 
        key,
        label, 
        value, 
        icon,
        confidence: meta.confidence,
        source: meta.source,
        isInferred: meta.isInferred
      });
    }
  };
  
  addTrait('temperament', 'Temperament', '🎭', soulAnswers.temperament);
  addTrait('general_nature', 'Nature', '💫', soulAnswers.general_nature);
  addTrait('energy_level', 'Energy', '⚡', soulAnswers.energy_level);
  addTrait('play_style', 'Play Style', '🎾', soulAnswers.play_style);
  addTrait('social_with_dogs', 'With Dogs', '🐕', soulAnswers.social_with_dogs);
  addTrait('social_with_people', 'With People', '👨‍👩‍👧', soulAnswers.social_with_people);
  
  if (soul.personality_tag) {
    traits.push({ 
      key: 'personality_tag',
      label: 'Personality', 
      value: soul.personality_tag, 
      icon: '👑',
      confidence: 100,
      source: 'derived',
      isInferred: false
    });
  }
  
  return (
    <div className="soul-profile-content" data-testid="soul-profile-content">
      {traits.length > 0 ? (
        <div className="soul-traits-grid">
          {traits.map((trait, i) => (
            <div key={i} className="soul-trait-card" data-testid={`trait-${trait.key}`}>
              <div className="trait-header">
                <span className="trait-icon">{trait.icon}</span>
                <TraitBadge confidence={trait.confidence} isInferred={trait.isInferred} />
              </div>
              <span className="trait-label">{trait.label}</span>
              <span className="trait-value">
                {Array.isArray(trait.value) ? trait.value.join(', ') : trait.value}
                {trait.confidence < 100 && (
                  <span className="trait-confidence-inline">({trait.confidence}%)</span>
                )}
              </span>
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

// Health Profile Content Component - Expanded per MOJO Bible
const HealthProfileContent = memo(({ pet }) => {
  const soulAnswers = pet?.doggy_soul_answers || {};
  const soulMeta = pet?.doggy_soul_meta || {};
  const preferences = pet?.preferences || {};
  const healthVault = pet?.health_vault || {};
  
  const allergies = preferences.allergies || soulAnswers.food_allergies || [];
  const weight = soulAnswers.weight;
  const spayedNeutered = soulAnswers.spayed_neutered;
  
  const items = [];
  
  // Critical: Allergies
  if (allergies && allergies.length > 0 && allergies[0] !== 'No') {
    const meta = getTraitMetadata('food_allergies', soulAnswers, soulMeta);
    items.push({ 
      key: 'food_allergies',
      label: 'Allergies', 
      value: Array.isArray(allergies) ? allergies.join(', ') : allergies, 
      icon: '⚠️', 
      critical: true,
      ...meta
    });
  }
  if (weight) {
    const meta = getTraitMetadata('weight', soulAnswers, soulMeta);
    items.push({ key: 'weight', label: 'Weight', value: weight, icon: '⚖️', ...meta });
  }
  if (spayedNeutered) {
    const meta = getTraitMetadata('spayed_neutered', soulAnswers, soulMeta);
    items.push({ key: 'spayed_neutered', label: 'Spayed/Neutered', value: spayedNeutered, icon: '✓', ...meta });
  }
  
  // Health Sensitivities
  if (soulAnswers.skin_sensitivity) {
    items.push({ key: 'skin_sensitivity', label: 'Skin Sensitivity', value: soulAnswers.skin_sensitivity, icon: '🧴' });
  }
  if (soulAnswers.gi_sensitivity) {
    items.push({ key: 'gi_sensitivity', label: 'Digestive Sensitivity', value: soulAnswers.gi_sensitivity, icon: '🥗' });
  }
  
  // Vaccination Status
  if (soulAnswers.vaccination_status || healthVault.vaccination_status) {
    items.push({ 
      key: 'vaccination_status', 
      label: 'Vaccinations', 
      value: soulAnswers.vaccination_status || healthVault.vaccination_status, 
      icon: '💉' 
    });
  }
  
  // Vet Details
  if (healthVault.vet_name || healthVault.vet_clinic) {
    items.push({ 
      key: 'vet_details', 
      label: 'Vet', 
      value: healthVault.vet_name || healthVault.vet_clinic, 
      icon: '👨‍⚕️' 
    });
  }
  
  // Chronic Conditions
  if (healthVault.chronic_conditions && healthVault.chronic_conditions.length > 0) {
    items.push({ 
      key: 'chronic_conditions', 
      label: 'Conditions', 
      value: Array.isArray(healthVault.chronic_conditions) ? healthVault.chronic_conditions.join(', ') : healthVault.chronic_conditions, 
      icon: '📋',
      critical: true
    });
  }
  
  // Microchip
  if (healthVault.microchip_number || soulAnswers.microchip_number) {
    items.push({ 
      key: 'microchip', 
      label: 'Microchip', 
      value: healthVault.microchip_number || soulAnswers.microchip_number, 
      icon: '📡' 
    });
  }
  
  // Insurance
  if (healthVault.insurance_provider) {
    items.push({ 
      key: 'insurance', 
      label: 'Insurance', 
      value: healthVault.insurance_provider, 
      icon: '🛡️' 
    });
  }
  
  // Emergency Contact
  if (healthVault.emergency_contact || pet?.emergency_contact) {
    items.push({ 
      key: 'emergency_contact', 
      label: 'Emergency Contact', 
      value: healthVault.emergency_contact || pet?.emergency_contact, 
      icon: '🆘' 
    });
  }
  
  return (
    <div className="health-profile-content" data-testid="health-profile-content">
      {items.length > 0 ? (
        <div className="health-items-list">
          {items.map((item, i) => (
            <div key={i} className={`health-item ${item.critical ? 'critical' : ''}`} data-testid={`health-${item.key}`}>
              <span className="health-icon">{item.icon}</span>
              <span className="health-label">{item.label}</span>
              <div className="health-value-container">
                <span className="health-value">{item.value}</span>
                {item.isInferred && (
                  <span className="trait-source-badge mira-learned small">
                    <Brain className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
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

// Environment Profile Content Component (NEW - per MOJO Bible)
const EnvironmentProfileContent = memo(({ pet }) => {
  const soulAnswers = pet?.doggy_soul_answers || {};
  const preferences = pet?.preferences || {};
  
  const items = [];
  
  // City/Location
  const city = pet?.city || soulAnswers.city || preferences.city;
  if (city) items.push({ label: 'Location', value: city, icon: '📍' });
  
  // Climate (derived from city or explicit)
  const climate = soulAnswers.climate || preferences.climate;
  if (climate) items.push({ label: 'Climate', value: climate, icon: '🌡️' });
  
  // Home Type
  const homeType = soulAnswers.home_type || preferences.home_type;
  if (homeType) items.push({ label: 'Home Type', value: homeType, icon: '🏠' });
  
  // Living Space
  const livingSpace = soulAnswers.living_space || preferences.living_space;
  if (livingSpace) items.push({ label: 'Living Space', value: livingSpace, icon: '📐' });
  
  // Family Structure
  const familyStructure = soulAnswers.family_structure || preferences.family_structure;
  if (familyStructure) items.push({ label: 'Family', value: familyStructure, icon: '👨‍👩‍👧' });
  
  // Other Pets
  const otherPets = soulAnswers.other_pets || preferences.other_pets;
  if (otherPets) {
    items.push({ 
      label: 'Other Pets', 
      value: Array.isArray(otherPets) ? otherPets.join(', ') : otherPets, 
      icon: '🐾' 
    });
  }
  
  // Travel Frequency
  const travelFreq = soulAnswers.travel_frequency || preferences.travel_frequency;
  if (travelFreq) items.push({ label: 'Travel Frequency', value: travelFreq, icon: '✈️' });
  
  // Outdoor Access
  const outdoorAccess = soulAnswers.outdoor_access || preferences.outdoor_access;
  if (outdoorAccess) items.push({ label: 'Outdoor Access', value: outdoorAccess, icon: '🌳' });
  
  return (
    <div className="environment-profile-content">
      {items.length > 0 ? (
        <div className="environment-items-list">
          {items.map((item, i) => (
            <div key={i} className="environment-item">
              <span className="environment-icon">{item.icon}</span>
              <span className="environment-label">{item.label}</span>
              <span className="environment-value">{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="environment-empty-state">
          <Home className="w-8 h-8 text-teal-400 mb-2" />
          <p>No environment information added yet</p>
          <p className="text-xs text-gray-400 mt-1">Add home, location, and living situation for personalized care</p>
        </div>
      )}
    </div>
  );
});

// Documents Vault Content Component  
const DocumentsProfileContent = memo(({ pet, apiUrl, token, onUploadClick }) => {
  const [paperworkDocs, setPaperworkDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const navigate = useNavigate();
  
  // Fetch documents from paperwork API
  useEffect(() => {
    const fetchPaperworkDocs = async () => {
      if (!pet?.id || !apiUrl) return;
      
      setLoadingDocs(true);
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(`${apiUrl}/api/paperwork/documents/${pet.id}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setPaperworkDocs(data.all_documents || []);
        }
      } catch (err) {
        console.error('[MOJO] Failed to fetch paperwork docs:', err);
      } finally {
        setLoadingDocs(false);
      }
    };
    
    fetchPaperworkDocs();
  }, [pet?.id, apiUrl, token]);
  
  const documents = pet?.documents || [];
  const healthVault = pet?.health_vault || {};
  
  // Combine documents from various sources
  const allDocs = [
    ...paperworkDocs.map(d => ({
      type: d.category || 'general',
      name: d.document_name,
      date: d.document_date || d.created_at,
      expiry: d.expiry_date,
      subcategory: d.subcategory,
      file_url: d.file_url
    })),
    ...documents.map(d => ({ type: d.type || 'general', name: d.name, date: d.date })),
    ...(healthVault.vaccination_records || []).map(v => ({ type: 'medical', name: v.name || 'Vaccination', date: v.date, subcategory: 'vaccination' })),
    ...(healthVault.medical_records || []).map(m => ({ type: 'medical', name: m.name || 'Medical Record', date: m.date })),
  ];
  
  // Category icons
  const getCategoryIcon = (type, subcategory) => {
    if (subcategory === 'vaccination' || type === 'vaccination') return '💉';
    if (type === 'medical' || subcategory === 'health_checkup') return '🏥';
    if (type === 'identity' || subcategory === 'microchip') return '🪪';
    if (type === 'travel' || subcategory === 'airline_cert') return '✈️';
    if (type === 'insurance' || subcategory === 'policy') return '🛡️';
    if (type === 'legal' || subcategory === 'license') return '📋';
    return '📄';
  };
  
  // Check for expiring documents
  const expiringDocs = allDocs.filter(d => {
    if (!d.expiry) return false;
    const daysUntil = Math.ceil((new Date(d.expiry) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil > 0 && daysUntil <= 30;
  });
  
  if (loadingDocs) {
    return (
      <div className="documents-profile-content">
        <div className="documents-loading">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          <span className="text-gray-400 text-sm">Loading documents...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="documents-profile-content">
      {/* Expiring Alert */}
      {expiringDocs.length > 0 && (
        <div className="documents-expiry-alert">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>{expiringDocs.length} document{expiringDocs.length > 1 ? 's' : ''} expiring soon</span>
        </div>
      )}
      
      {allDocs.length > 0 ? (
        <>
          <div className="documents-list">
            {allDocs.slice(0, 5).map((doc, i) => (
              <div key={i} className="document-item">
                <span className="document-icon">
                  {getCategoryIcon(doc.type, doc.subcategory)}
                </span>
                <div className="document-info">
                  <span className="document-name">{doc.name}</span>
                  {doc.expiry && (
                    <span className={`document-expiry ${new Date(doc.expiry) < new Date() ? 'expired' : ''}`}>
                      Exp: {new Date(doc.expiry).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
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
          
          {/* Upload More Button */}
          <button 
            className="documents-upload-btn"
            onClick={() => navigate('/paperwork')}
            data-testid="upload-more-docs-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Upload More Documents</span>
          </button>
        </>
      ) : (
        <div className="documents-empty-state">
          <FileText className="w-8 h-8 text-cyan-400 mb-2" />
          <p>No documents uploaded yet</p>
          <p className="text-xs text-gray-400 mt-1">Store vaccination records, insurance, and prescriptions</p>
          <button 
            className="documents-upload-btn primary"
            onClick={() => navigate('/paperwork')}
            data-testid="upload-first-doc-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Documents</span>
          </button>
        </div>
      )}
    </div>
  );
});

// Life Timeline Content Component - Fetches aggregated timeline from API
const TimelineProfileContent = memo(({ pet, apiUrl, token }) => {
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  
  // Fetch aggregated timeline from API
  useEffect(() => {
    const fetchTimeline = async () => {
      if (!pet?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const baseUrl = apiUrl || process.env.REACT_APP_BACKEND_URL || '';
        const response = await fetch(
          `${baseUrl}/api/pet-soul/profile/${pet.id}/life-timeline?limit=20`,
          { headers }
        );
        
        if (response.ok) {
          const data = await response.json();
          setTimelineData(data);
        }
      } catch (err) {
        console.log('[Timeline] Error fetching:', err);
      }
      setLoading(false);
    };
    
    fetchTimeline();
  }, [pet?.id, apiUrl, token]);
  
  // Fallback to local data if API fails
  const getLocalTimeline = () => {
    const items = [];
    const soulAnswers = pet?.doggy_soul_answers || {};
    
    // Birthday
    const birthday = pet?.birthday || pet?.dob || soulAnswers.dob;
    if (birthday) {
      items.push({
        icon: '🎂',
        title: `${pet?.name}'s Birthday`,
        date: birthday,
        type: 'birthday',
        category: 'milestone'
      });
    }
    
    // Adoption
    const adoption = soulAnswers.adoption_date || pet?.gotcha_date;
    if (adoption) {
      items.push({
        icon: '🏠',
        title: 'Joined the family',
        date: adoption,
        type: 'adoption',
        category: 'milestone'
      });
    }
    
    // Manual events
    const events = soulAnswers.timeline_events || pet?.life_events || [];
    events.forEach(e => {
      items.push({
        icon: e.icon || '📍',
        title: e.title || e.name,
        date: e.date,
        type: e.type || 'event',
        category: 'milestone'
      });
    });
    
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  };
  
  const timelineItems = timelineData?.timeline || getLocalTimeline();
  const displayItems = showAll ? timelineItems : timelineItems.slice(0, 5);
  
  // Category badges
  const categoryColors = {
    milestone: 'bg-amber-500/20 text-amber-400',
    purchase: 'bg-green-500/20 text-green-400',
    service: 'bg-blue-500/20 text-blue-400',
    health: 'bg-red-500/20 text-red-400',
    care: 'bg-pink-500/20 text-pink-400'
  };
  
  if (loading) {
    return (
      <div className="timeline-loading">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        <span className="text-sm text-gray-400 mt-2">Loading timeline...</span>
      </div>
    );
  }
  
  return (
    <div className="timeline-profile-content" data-testid="life-timeline">
      {/* Category summary badges */}
      {timelineData?.categories && Object.keys(timelineData.categories).length > 0 && (
        <div className="timeline-categories">
          {Object.entries(timelineData.categories).map(([cat, count]) => (
            <span key={cat} className={`timeline-category-badge ${categoryColors[cat] || 'bg-gray-500/20 text-gray-400'}`}>
              {cat} ({count})
            </span>
          ))}
        </div>
      )}
      
      {displayItems.length > 0 ? (
        <>
          <div className="timeline-list">
            {displayItems.map((item, i) => (
              <div key={item.id || i} className="timeline-item" data-testid={`timeline-item-${item.type}`}>
                <span className="timeline-icon">{item.icon}</span>
                <div className="timeline-details">
                  <span className="timeline-title">{item.title}</span>
                  {item.description && (
                    <span className="timeline-description">{item.description}</span>
                  )}
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
                {item.source && item.source !== 'profile' && (
                  <span className={`timeline-source ${categoryColors[item.category] || ''}`}>
                    {item.source === 'orders' ? '🛍️' : item.source === 'service_desk' ? '🔧' : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
          
          {/* Show more button */}
          {timelineItems.length > 5 && (
            <button 
              className="timeline-show-more"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show less' : `Show ${timelineItems.length - 5} more`}
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            </button>
          )}
        </>
      ) : (
        <div className="timeline-empty-state">
          <Clock className="w-8 h-8 text-amber-400 mb-2" />
          <p>No timeline events yet</p>
          <p className="text-xs text-gray-400 mt-1">Add milestones, adoption day, and memorable moments</p>
          <p className="text-xs text-gray-500 mt-2">Orders and services will appear here automatically</p>
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

// Pet Life Pass Card - Membership & Rewards Component
// Per MOJO Bible: "Membership & Rewards" must show the full Pet Life Pass
const MembershipRewards = memo(({ membership, badges, petPassNumber, onViewRewards }) => {
  const [copied, setCopied] = useState(false);
  
  const hasMembership = membership && (membership.tier || membership.paw_points !== undefined);
  
  // Tier configurations matching the dashboard
  const TIER_CONFIG = {
    'bronze': { name: 'Bronze Pup', gradient: 'from-amber-600 via-amber-500 to-amber-700', icon: '🐾' },
    'silver': { name: 'Silver Star', gradient: 'from-slate-400 via-slate-300 to-slate-500', icon: '⭐' },
    'gold': { name: 'Gold Crown', gradient: 'from-yellow-500 via-amber-400 to-yellow-600', icon: '👑' },
    'pawsome': { name: 'Silver Star', gradient: 'from-slate-400 via-slate-300 to-slate-500', icon: '⭐' },
    'member': { name: 'Member', gradient: 'from-purple-500 via-purple-400 to-purple-600', icon: '🐕' },
  };
  
  const tierKey = (membership?.tier || 'member').toLowerCase();
  const tierConfig = TIER_CONFIG[tierKey] || TIER_CONFIG['member'];
  const points = membership?.paw_points || membership?.points || 0;
  const passNumber = petPassNumber || membership?.pet_pass_number || 'TDC-XXXXXX';
  
  // Calculate progress to next tier
  const getNextTierInfo = () => {
    if (tierKey === 'bronze' || tierKey === 'member') return { next: 'Silver Star', pointsNeeded: 1000 - points };
    if (tierKey === 'silver' || tierKey === 'pawsome') return { next: 'Gold Crown', pointsNeeded: 5000 - points };
    return null;
  };
  const nextTierInfo = getNextTierInfo();
  const progressPercent = nextTierInfo 
    ? Math.min(100, (points / (points + nextTierInfo.pointsNeeded)) * 100)
    : 100;
  
  const copyPetPass = () => {
    navigator.clipboard.writeText(passNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!hasMembership) {
    return (
      <div className="membership-section coming-soon" data-testid="membership-section">
        <div className="membership-header">
          <Crown className="w-5 h-5 text-amber-400" />
          <span className="membership-title">Pet Life Pass</span>
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
    <div className="membership-section pet-life-pass" data-testid="membership-section">
      {/* Pet Life Pass Card - Matching Dashboard Design */}
      <div 
        className={`pet-pass-card bg-gradient-to-br ${tierConfig.gradient}`}
        onClick={onViewRewards}
        data-testid="pet-life-pass-card"
      >
        {/* Background Pattern */}
        <div className="pass-card-pattern">
          <div className="pattern-circle pattern-circle-1"></div>
          <div className="pattern-circle pattern-circle-2"></div>
        </div>
        
        {/* Card Content */}
        <div className="pass-card-content">
          {/* Header */}
          <div className="pass-card-header">
            <div className="pass-brand">
              <div className="pass-logo">TD</div>
              <span className="pass-title">Pet Life Pass</span>
            </div>
            <div className="pass-tier-badge">
              <span className="tier-icon">{tierConfig.icon}</span>
              <span className="tier-name">{tierConfig.name}</span>
            </div>
          </div>
          
          {/* Pass Number - Clickable */}
          <button 
            className="pass-number-btn"
            onClick={(e) => { e.stopPropagation(); copyPetPass(); }}
            data-testid="copy-pass-number"
          >
            <span className="pass-number">{passNumber}</span>
            {copied ? (
              <Check className="w-4 h-4 text-green-300" />
            ) : (
              <span className="copy-icon">📋</span>
            )}
          </button>
          
          {/* Points Section */}
          <div className="pass-points-section">
            <div className="points-info">
              <span className="points-label">Loyalty Points</span>
              <span className="points-value">{points.toLocaleString()}</span>
            </div>
            <div className="points-worth">
              <span className="worth-label">Worth</span>
              <span className="worth-value">₹{Math.round(points * 0.5)}</span>
            </div>
          </div>
          
          {/* Progress to Next Tier */}
          {nextTierInfo && nextTierInfo.pointsNeeded > 0 && (
            <div className="pass-progress">
              <div className="progress-text">
                <span>{nextTierInfo.pointsNeeded.toLocaleString()} points to {nextTierInfo.next}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          
          {/* View Full Card Link */}
          <div className="pass-card-footer">
            <span className="view-card-text">Click to view full card</span>
          </div>
        </div>
      </div>
      
      {/* Badges Section */}
      {badges && badges.length > 0 && (
        <div className="membership-badges">
          <h4 className="badges-title">Badges Earned</h4>
          <div className="badges-grid">
            {badges.slice(0, 6).map((badge, i) => {
              // Handle both string badges and object badges
              const badgeName = typeof badge === 'string' ? badge : badge.name;
              const badgeIcon = typeof badge === 'string' ? '🏆' : (badge.icon || '🏆');
              return (
                <div key={i} className="badge-item" title={badgeName}>
                  <span className="badge-icon">{badgeIcon}</span>
                  <span className="badge-name">{badgeName.replace(/_/g, ' ')}</span>
                </div>
              );
            })}
            {badges.length > 6 && (
              <div className="badge-item more">
                <span className="badge-icon">+{badges.length - 6}</span>
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
  onRefreshPet, // NEW: Callback to refresh pet data after insight actions
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
  
  // Inline editing state
  const [editingSection, setEditingSection] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  
  // Fetch full pet data on open
  useEffect(() => {
    const loadData = async () => {
      if (!pet?.id) return;
      
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
          userEmail 
            ? fetch(`${apiUrl}/api/member/profile?user_email=${encodeURIComponent(userEmail)}`, { headers }).catch(() => null)
            : fetch(`${apiUrl}/api/member/profile`, { headers }).catch(() => null)
        ]);
        
        // Process pet data
        if (petResponse?.ok) {
          const petData = await petResponse.json();
          console.log('[MOJO] Pet data loaded:', petData.name, 'Score:', petData.overall_score);
          console.log('[MOJO] doggy_soul_meta:', petData.doggy_soul_meta);
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
        
        // Process member profile
        if (memberResponse?.ok) {
          const memberData = await memberResponse.json();
          console.log('[MOJO] Member profile loaded:', memberData.name, 'Points:', memberData.loyalty_points);
          setMembershipData({
            tier: memberData.membership_tier,
            expires: memberData.membership_expires,
            paw_points: memberData.loyalty_points || memberData.paw_points || 0,
            pet_pass_number: `TDC-${(memberData.id || '').slice(-6).toUpperCase()}`
          });
          
          // Get badges from member profile
          if (memberData.credited_achievements) {
            setBadgesData(memberData.credited_achievements);
          }
        }
      } catch (error) {
        console.error('[MOJO] Error fetching pet data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen) {
      loadData();
    }
  }, [isOpen, pet?.id, apiUrl, token, userEmail]);
  
  // Deep link to soul section
  useEffect(() => {
    if (isOpen && deepLinkSection === 'soul') {
      setTimeout(() => {
        // Check ref inside timeout to avoid null reference error
        if (soulSectionRef.current) {
          soulSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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
        console.log('[MOJO] doggy_soul_meta:', petData.doggy_soul_meta);
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
          paw_points: memberData.loyalty_points || memberData.paw_points || 0,
          member_since: memberData.created_at 
            ? new Date(memberData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : null,
          expires: memberData.membership_expires,
          next_tier: getNextTier(memberData.membership_tier),
          points_to_next: calculatePointsToNextTier(memberData.loyalty_points || memberData.paw_points || 0, memberData.membership_tier),
          pet_pass_number: `TDC-${(memberData.id || '').slice(-6).toUpperCase()}`
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
  
  // Handle inline edit click
  const handleEditSectionClick = useCallback((sectionId) => {
    hapticFeedback.buttonTap();
    setEditingSection(sectionId);
    // Ensure section is expanded when editing
    if (!expandedSections.includes(sectionId)) {
      setExpandedSections(prev => [...prev, sectionId]);
    }
  }, [expandedSections]);
  
  // Cancel/Done editing - closes the editor
  const handleCancelEdit = useCallback(() => {
    setEditingSection(null);
    // Refresh data to get latest scores after editing
    fetchFullPetData();
  }, []);
  
  // Save edited data to backend (called by auto-save from editors)
  const handleSaveSection = useCallback(async (sectionId, data) => {
    if (!pet?.id || !apiUrl) return;
    
    // Don't show toast during auto-save, let the editor's indicator handle it
    console.log('[MOJO] Auto-saving section:', sectionId, data);
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      // Call the bulk answers endpoint
      const response = await fetch(`${apiUrl}/api/pet-soul/profile/${pet.id}/answers/bulk`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save');
      }
      
      const result = await response.json();
      console.log('[MOJO] Auto-save result:', result);
      
      // Update local state with new data
      setFullPetData(prev => ({
        ...prev,
        doggy_soul_answers: {
          ...(prev?.doggy_soul_answers || {}),
          ...data
        }
      }));
      
      // Update soul score if returned
      if (result.overall_score !== undefined) {
        setComputedSoulScore(Math.round(result.overall_score));
      }
      
      // Don't exit edit mode or show toast - let the editor handle this
      // The auto-save indicator in the editor shows the status
      
    } catch (err) {
      console.error('[MOJO] Auto-save error:', err);
      throw err; // Re-throw so the auto-save hook can show error state
    }
  }, [pet?.id, apiUrl, token]);
  
  // Handle "Done" button click - close editor and refresh data
  const handleDoneEditing = useCallback(() => {
    setEditingSection(null);
    // Refresh data to get latest scores
    fetchFullPetData();
  }, []);
  
  // Handle add/edit click for a section (legacy - navigates away)
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
          <h2 className="mojo-title">{petData?.name || 'MOJO'}</h2>
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
                const isEditing = editingSection === section.id;
                
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
                      isEditing={isEditing}
                      onToggle={toggleSection}
                      onAddClick={handleAddClick}
                      onEditClick={handleEditSectionClick}
                    >
                      {/* Show Editor when editing, otherwise show content */}
                      {isEditing ? (
                        <>
                          {section.id === 'soul' && (
                            <SoulProfileEditor 
                              pet={petData} 
                              onSave={(data) => handleSaveSection(section.id, data)}
                              onCancel={handleCancelEdit}
                              saving={saving}
                            />
                          )}
                          {section.id === 'health' && (
                            <HealthProfileEditor 
                              pet={petData} 
                              onSave={(data) => handleSaveSection(section.id, data)}
                              onCancel={handleCancelEdit}
                              saving={saving}
                            />
                          )}
                          {section.id === 'diet' && (
                            <DietProfileEditor 
                              pet={petData} 
                              onSave={(data) => handleSaveSection(section.id, data)}
                              onCancel={handleCancelEdit}
                              saving={saving}
                            />
                          )}
                          {section.id === 'behaviour' && (
                            <BehaviourProfileEditor 
                              pet={petData} 
                              onSave={(data) => handleSaveSection(section.id, data)}
                              onCancel={handleCancelEdit}
                              saving={saving}
                            />
                          )}
                          {section.id === 'grooming' && (
                            <GroomingProfileEditor 
                              pet={petData} 
                              onSave={(data) => handleSaveSection(section.id, data)}
                              onCancel={handleCancelEdit}
                              saving={saving}
                            />
                          )}
                          {section.id === 'routine' && (
                            <RoutineProfileEditor 
                              pet={petData} 
                              onSave={(data) => handleSaveSection(section.id, data)}
                              onCancel={handleCancelEdit}
                              saving={saving}
                            />
                          )}
                          {section.id === 'timeline' && (
                            <TimelineEventEditor 
                              pet={petData} 
                              onSave={(data) => handleSaveSection(section.id, data)}
                              onCancel={handleCancelEdit}
                              saving={saving}
                            />
                          )}
                          {section.id === 'preferences' && (
                            <PreferencesProfileEditor 
                              pet={petData} 
                              onSave={(data) => handleSaveSection(section.id, data)}
                              onCancel={handleCancelEdit}
                              saving={saving}
                            />
                          )}
                          {section.id === 'documents' && (
                            <div className="mojo-editor-placeholder">
                              <p>Document upload coming soon</p>
                              <button className="text-purple-400 underline" onClick={handleCancelEdit}>Cancel</button>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Section-specific content */}
                          {section.id === 'soul' && <SoulProfileContent pet={petData} />}
                          {section.id === 'learned' && (
                            <LearnedFactsContent 
                              pet={petData} 
                              apiUrl={apiUrl}
                              token={token}
                              onInsightAction={async (action, insightId) => {
                                // Refresh pet data after confirm/reject
                                console.log(`[MOJO] Insight ${insightId} ${action}ed, refreshing...`);
                                
                                // Call the parent's refresh function
                                if (onRefreshPet) {
                                  await onRefreshPet();
                                  // Re-fetch full pet data for modal
                                  fetchFullPetData();
                                }
                              }}
                            />
                          )}
                          {section.id === 'trait_graph' && (
                            <TraitGraphVisualization 
                              petId={pet?.id}
                              petName={petData?.name}
                              apiUrl={apiUrl}
                              token={token}
                              isOpen={isExpanded}
                            />
                          )}
                          {section.id === 'health' && <HealthProfileContent pet={petData} />}
                          {section.id === 'diet' && <DietProfileContent pet={petData} />}
                          {section.id === 'behaviour' && <BehaviourProfileContent pet={petData} />}
                          {section.id === 'grooming' && <GroomingProfileContent pet={petData} />}
                          {section.id === 'routine' && <RoutineProfileContent pet={petData} />}
                          {section.id === 'environment' && <EnvironmentProfileContent pet={petData} />}
                          {section.id === 'documents' && <DocumentsProfileContent pet={petData} apiUrl={apiUrl} token={token} />}
                          {section.id === 'timeline' && <TimelineProfileContent pet={petData} apiUrl={apiUrl} token={token} />}
                          {section.id === 'preferences' && <PreferencesProfileContent pet={petData} />}
                        </>
                      )}
                    </SectionRow>
                  </div>
                );
              })}
            </div>
            
            {/* Membership & Rewards - Pet Life Pass */}
            <MembershipRewards 
              membership={membershipData}
              badges={badgesData}
              petPassNumber={fullPetData?.pet_pass_number || pet?.pet_pass_number}
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
        
        {/* Save Toast */}
        {saveToast && (
          <div className={`mojo-save-toast ${saveToast.type}`}>
            {saveToast.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{saveToast.message}</span>
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
        
        /* Trait Card with Confidence */
        .trait-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        
        .trait-meta {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .trait-source-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        .trait-source-badge.mira-learned {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2));
          color: #E879F9;
          border: 1px solid rgba(236, 72, 153, 0.3);
        }
        
        .trait-source-badge.mira-learned svg {
          color: #E879F9;
        }
        
        .trait-confidence {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 5px;
          border-radius: 4px;
        }
        
        .trait-confidence.high {
          background: rgba(34, 197, 94, 0.2);
          color: #86EFAC;
        }
        
        .trait-confidence.medium {
          background: rgba(245, 158, 11, 0.2);
          color: #FCD34D;
        }
        
        .trait-confidence.low {
          background: rgba(239, 68, 68, 0.2);
          color: #FCA5A5;
        }
        
        .trait-confidence-inline {
          font-size: 11px;
          color: #9CA3AF;
          font-weight: 400;
          margin-left: 4px;
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
        
        .health-value-container {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          justify-content: flex-end;
        }
        
        .health-value {
          font-size: 14px;
          color: white;
          font-weight: 500;
        }
        
        .trait-source-badge.small {
          padding: 2px 4px;
        }
        
        .health-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          text-align: center;
          color: #FCA5A5;
        }
        
        /* Generic Section Content Styles (Diet, Behaviour, Grooming, Routine, Environment, Preferences) */
        .diet-profile-content,
        .behaviour-profile-content,
        .grooming-profile-content,
        .routine-profile-content,
        .environment-profile-content,
        .preferences-profile-content,
        .documents-profile-content,
        .timeline-profile-content {
          padding: 8px 0;
        }
        
        .diet-items-list,
        .behaviour-items-list,
        .grooming-items-list,
        .routine-items-list,
        .environment-items-list,
        .preferences-list,
        .documents-list,
        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .diet-item,
        .behaviour-item,
        .grooming-item,
        .routine-item,
        .environment-item,
        .preferences-item,
        .document-item,
        .timeline-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(139, 92, 246, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.1);
        }
        
        .diet-icon,
        .behaviour-icon,
        .grooming-icon,
        .routine-icon,
        .environment-icon,
        .preferences-icon,
        .document-icon,
        .timeline-icon {
          font-size: 18px;
          flex-shrink: 0;
        }
        
        .diet-label,
        .behaviour-label,
        .grooming-label,
        .routine-label,
        .environment-label,
        .preferences-label,
        .document-name,
        .timeline-title {
          font-size: 12px;
          color: #9CA3AF;
          min-width: 100px;
        }
        
        .diet-value,
        .behaviour-value,
        .grooming-value,
        .routine-value,
        .environment-value,
        .preferences-value {
          font-size: 14px;
          color: white;
          font-weight: 500;
          flex: 1;
          text-align: right;
        }
        
        /* Environment specific */
        .environment-empty-state {
          text-align: center;
          padding: 20px;
          color: #9CA3AF;
        }
        
        /* Preferences specific colors */
        .preferences-item.positive {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.2);
        }
        
        .preferences-item.negative {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
        }
        
        .preferences-item.warning {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.2);
        }
        
        .preferences-item.special {
          background: rgba(168, 85, 247, 0.1);
          border-color: rgba(168, 85, 247, 0.2);
        }
        
        /* Timeline specific */
        .timeline-details {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        .timeline-title {
          font-size: 14px;
          color: white;
          font-weight: 500;
          min-width: auto;
        }
        
        .timeline-date {
          font-size: 11px;
          color: #9CA3AF;
          margin-top: 2px;
        }
        
        .timeline-description {
          font-size: 12px;
          color: #6B7280;
          margin-top: 2px;
        }
        
        .timeline-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        
        .timeline-category-badge {
          font-size: 10px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: capitalize;
        }
        
        .timeline-source {
          font-size: 12px;
          flex-shrink: 0;
        }
        
        .timeline-show-more {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          margin-top: 12px;
          padding: 10px;
          border-radius: 10px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          color: #FBBF24;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .timeline-show-more:hover {
          background: rgba(245, 158, 11, 0.2);
        }
        
        .timeline-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
        }
        
        /* Documents specific */
        .document-item {
          justify-content: flex-start;
        }
        
        .document-name {
          flex: 1;
          font-size: 14px;
          color: white;
          min-width: auto;
        }
        
        .document-date {
          font-size: 11px;
          color: #9CA3AF;
        }
        
        .documents-more {
          text-align: center;
          font-size: 12px;
          color: #a78bfa;
          padding: 8px;
        }
        
        /* Documents Extended Styles */
        .documents-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px;
        }
        
        .documents-expiry-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 10px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #FCD34D;
        }
        
        .document-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .document-expiry {
          font-size: 10px;
          color: #9CA3AF;
        }
        
        .document-expiry.expired {
          color: #FCA5A5;
        }
        
        .documents-upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(34, 211, 238, 0.1);
          border: 1px dashed rgba(34, 211, 238, 0.3);
          color: #22D3EE;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .documents-upload-btn:hover {
          background: rgba(34, 211, 238, 0.2);
        }
        
        .documents-upload-btn.primary {
          background: rgba(34, 211, 238, 0.2);
          border-style: solid;
          margin-top: 16px;
        }
        
        /* Empty states for all sections */
        .diet-empty-state,
        .behaviour-empty-state,
        .grooming-empty-state,
        .routine-empty-state,
        .preferences-empty-state,
        .documents-empty-state,
        .timeline-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          text-align: center;
          color: #a78bfa;
        }
        
        /* Membership Section */
        .membership-section {
          margin: 16px;
          padding: 16px;
          background: transparent;
          border-radius: 20px;
        }
        
        .membership-section.pet-life-pass {
          padding: 0;
        }
        
        .membership-section.coming-soon {
          background: rgba(107, 114, 128, 0.1);
          border: 1px solid rgba(107, 114, 128, 0.2);
          padding: 20px;
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
        
        /* ═══════════════════════════════════════════════════════════════
           PET LIFE PASS CARD - Beautiful gradient card like dashboard
           ═══════════════════════════════════════════════════════════════ */
        .pet-pass-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin: 16px;
        }
        
        .pet-pass-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        }
        
        .pet-pass-card:active {
          transform: translateY(0);
        }
        
        .pass-card-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.15;
          pointer-events: none;
        }
        
        .pattern-circle {
          position: absolute;
          border-radius: 50%;
          border: 4px solid white;
        }
        
        .pattern-circle-1 {
          top: -20px;
          right: -20px;
          width: 120px;
          height: 120px;
        }
        
        .pattern-circle-2 {
          bottom: -10px;
          left: -10px;
          width: 80px;
          height: 80px;
        }
        
        .pass-card-content {
          position: relative;
          padding: 20px;
          color: white;
        }
        
        .pass-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        
        .pass-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .pass-logo {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
        }
        
        .pass-title {
          font-weight: 700;
          font-size: 16px;
          letter-spacing: 0.5px;
        }
        
        .pass-tier-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.2);
          font-size: 12px;
          font-weight: 600;
        }
        
        .tier-icon {
          font-size: 14px;
        }
        
        .pass-number-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-family: 'SF Mono', 'Menlo', monospace;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .pass-number-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .pass-number-btn:active {
          background: rgba(255, 255, 255, 0.25);
        }
        
        .pass-points-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 20px;
        }
        
        .points-info,
        .points-worth {
          display: flex;
          flex-direction: column;
        }
        
        .points-label,
        .worth-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2px;
        }
        
        .points-value {
          font-size: 28px;
          font-weight: 800;
          line-height: 1;
        }
        
        .worth-value {
          font-size: 18px;
          font-weight: 700;
        }
        
        .pass-progress {
          margin-top: 16px;
        }
        
        .progress-text {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 6px;
        }
        
        .progress-bar {
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.2);
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          background: white;
          transition: width 0.5s ease;
        }
        
        .pass-card-footer {
          margin-top: 14px;
          text-align: center;
        }
        
        .view-card-text {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
        }
        
        /* Membership Badges */
        .membership-badges {
          margin: 20px 16px 0;
        }
        
        .badges-title {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
        }
        
        .badges-grid {
          display: flex;
          gap: 10px;
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
        
        /* Save Toast */
        .mojo-save-toast {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 24px;
          font-size: 14px;
          font-weight: 500;
          animation: toastSlideUp 0.3s ease-out;
          z-index: 100;
        }
        
        .mojo-save-toast.success {
          background: linear-gradient(135deg, #059669, #10B981);
          color: white;
        }
        
        .mojo-save-toast.error {
          background: linear-gradient(135deg, #DC2626, #EF4444);
          color: white;
        }
        
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        
        /* Section Actions Row */
        .section-actions-row {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(139, 92, 246, 0.1);
        }
        
        .section-edit-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: #a78bfa;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .section-edit-btn:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.4);
        }
        
        /* Editing state */
        .mojo-section.editing .section-header {
          border-color: #8B5CF6;
        }
        
        /* Editor placeholder for documents */
        .mojo-editor-placeholder {
          padding: 20px;
          text-align: center;
          color: #9CA3AF;
        }
        
        /* Editor Styles (from MojoSectionEditors) */
        ${editorStyles}
      `}</style>
    </div>
  );
};

export default MojoProfileModal;
