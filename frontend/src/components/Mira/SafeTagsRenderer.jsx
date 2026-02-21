/**
 * SafeTagsRenderer.jsx - Renders pet tags with health-first safety logic
 * ======================================================================
 * 
 * RULES:
 * - Health/allergy tags always render
 * - Preference tags suppressed if they conflict with health restrictions
 * - Shows "syncing" indicator if safe-tags API fails
 * 
 * Usage:
 *   <SafeTagsRenderer pet={pet} token={token} maxTags={3} variant="pill" />
 */

import React, { memo, useMemo } from 'react';
import { Shield, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useSafeTags, filterUnsafeTags } from '../../hooks/mira/useSafeTags';

// Category emoji mapping
const CATEGORY_EMOJI = {
  fears: '😰',
  loves: '❤️',
  anxiety: '😟',
  behavior: '🐕',
  preferences: '⭐',
  health: '💊',
  other: '📝',
};

// Variant styles
const VARIANT_STYLES = {
  pill: {
    container: 'flex flex-wrap gap-2',
    tag: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs',
    tagBg: 'bg-white/10 backdrop-blur-sm',
    healthBg: 'bg-green-500/20 border border-green-500/30',
    text: 'text-white/80',
    healthText: 'text-green-400',
  },
  chip: {
    container: 'flex flex-wrap gap-1.5',
    tag: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px]',
    tagBg: 'bg-white/5 border border-white/10',
    healthBg: 'bg-green-500/10 border border-green-500/20',
    text: 'text-white/70',
    healthText: 'text-green-400',
  },
  compact: {
    container: 'flex flex-wrap gap-1',
    tag: 'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px]',
    tagBg: 'bg-white/5',
    healthBg: 'bg-green-500/10',
    text: 'text-white/60',
    healthText: 'text-green-400',
  },
};

const SafeTagsRenderer = memo(({ 
  pet, 
  token,
  maxTags = 3,
  variant = 'pill',
  showHealth = true,
  showPreferences = true,
  showSyncIndicator = true,
  fallbackToRaw = true,
  className = '',
}) => {
  const petId = pet?.id;
  const { safeTags, suppressedTags, isLoading, isSyncing, hasConflicts, refresh } = useSafeTags(petId, token);
  
  // Get styles for variant
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.pill;
  
  // Compute display tags
  const displayTags = useMemo(() => {
    let tags = [];
    
    // If we have safe tags from API, use those
    if (safeTags.length > 0) {
      tags = safeTags
        .filter(t => {
          if (t.is_health && !showHealth) return false;
          if (!t.is_health && !showPreferences) return false;
          return true;
        })
        .slice(0, maxTags);
    } 
    // Fallback: use raw learned_facts with client-side filtering
    else if (fallbackToRaw && pet?.learned_facts?.length > 0) {
      const { safe } = filterUnsafeTags(pet.learned_facts);
      tags = safe
        .filter(t => {
          if (t.is_health && !showHealth) return false;
          if (!t.is_health && !showPreferences) return false;
          return true;
        })
        .slice(0, maxTags);
    }
    
    return tags;
  }, [safeTags, pet?.learned_facts, showHealth, showPreferences, maxTags, fallbackToRaw]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <span className={`${styles.tag} ${styles.tagBg} ${styles.text} animate-pulse`}>
          <Loader2 size={10} className="animate-spin" />
          Loading...
        </span>
      </div>
    );
  }
  
  // No tags
  if (displayTags.length === 0 && !isSyncing) {
    return null;
  }
  
  return (
    <div className={`${styles.container} ${className}`}>
      {/* Syncing indicator */}
      {isSyncing && showSyncIndicator && (
        <span 
          className={`${styles.tag} bg-amber-500/10 border border-amber-500/20 text-amber-400`}
          title="Tag safety check in progress"
        >
          <RefreshCw size={10} className="animate-spin" />
          syncing
        </span>
      )}
      
      {/* Render safe tags */}
      {displayTags.map((tag, idx) => {
        const isHealth = tag.is_health || tag.category === 'health';
        const emoji = CATEGORY_EMOJI[tag.category] || '📝';
        
        return (
          <span
            key={tag.id || idx}
            className={`
              ${styles.tag}
              ${isHealth ? styles.healthBg : styles.tagBg}
              ${isHealth ? styles.healthText : styles.text}
            `}
            title={isHealth ? 'Health/allergy information' : null}
          >
            {isHealth && <Shield size={10} />}
            <span>{emoji}</span>
            <span className="truncate max-w-[120px]">
              {tag.content}
            </span>
          </span>
        );
      })}
      
      {/* Conflict indicator (if any tags are suppressed) */}
      {hasConflicts && suppressedTags.length > 0 && (
        <span
          className={`${styles.tag} bg-amber-500/5 border border-amber-500/10 text-amber-400/60 cursor-help`}
          title={`${suppressedTags.length} preference(s) hidden due to health restrictions`}
        >
          <AlertTriangle size={10} />
          <span className="text-[9px]">{suppressedTags.length} hidden</span>
        </span>
      )}
    </div>
  );
});

SafeTagsRenderer.displayName = 'SafeTagsRenderer';

/**
 * Simple "Loves X" trait display with safety filtering
 */
export const SafeTraitPill = memo(({ pet, token, category = 'loves', className = '' }) => {
  const { safeTags, isSyncing } = useSafeTags(pet?.id, token);
  
  // Find first matching tag in category
  const tag = useMemo(() => {
    return safeTags.find(t => t.category === category && !t.suppressed);
  }, [safeTags, category]);
  
  if (isSyncing) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 rounded-full text-xs text-white/60 ${className}`}>
        <RefreshCw size={10} className="animate-spin" />
        syncing
      </span>
    );
  }
  
  if (!tag) return null;
  
  const emoji = CATEGORY_EMOJI[tag.category] || '❤️';
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/80 ${className}`}>
      <span>{emoji}</span>
      <span>Loves {tag.content}</span>
    </span>
  );
});

SafeTraitPill.displayName = 'SafeTraitPill';

export default SafeTagsRenderer;
