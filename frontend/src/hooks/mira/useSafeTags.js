/**
 * useSafeTags.js - Centralized hook for fetching conflict-safe pet tags
 * ======================================================================
 * 
 * RULES:
 * - Health/allergy tags always render
 * - Preference tags suppressed if they conflict with health restrictions
 * - Fallback to raw tags with "syncing" indicator if API fails
 * 
 * Usage:
 *   const { safeTags, suppressedTags, isLoading, isSyncing, hasConflicts } = useSafeTags(petId);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getApiUrl } from '../../utils/api';

// Cache for safe tags to avoid excessive API calls
const safeTagsCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

export const useSafeTags = (petId, token) => {
  const [safeTags, setSafeTags] = useState([]);
  const [suppressedTags, setSuppressedTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  
  const fetchSafeTags = useCallback(async () => {
    if (!petId || !token) {
      setIsLoading(false);
      return;
    }
    
    // Check cache first
    const cached = safeTagsCache.get(petId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setSafeTags(cached.visible_tags || []);
      setSuppressedTags(cached.suppressed_tags || []);
      setHasConflicts(cached.has_conflicts || false);
      setIsLoading(false);
      return;
    }
    
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(
        `${apiUrl}/api/os/concierge/safe-tags/${petId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!mountedRef.current) return;
      
      if (response.ok) {
        const data = await response.json();
        
        // Update cache
        safeTagsCache.set(petId, {
          ...data,
          timestamp: Date.now()
        });
        
        setSafeTags(data.visible_tags || []);
        setSuppressedTags(data.suppressed_tags || []);
        setHasConflicts(data.has_conflicts || false);
        setIsSyncing(false);
        setError(null);
      } else {
        // API failed - set syncing state
        setIsSyncing(true);
        setError('Failed to fetch safe tags');
        console.warn('[SAFE-TAGS] API failed, using fallback mode');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      console.error('[SAFE-TAGS] Error fetching:', err);
      setIsSyncing(true);
      setError(err.message);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [petId, token]);
  
  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchSafeTags();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSafeTags]);
  
  // Refresh function for manual refresh
  const refresh = useCallback(() => {
    // Invalidate cache
    safeTagsCache.delete(petId);
    setIsLoading(true);
    fetchSafeTags();
  }, [petId, fetchSafeTags]);
  
  return {
    safeTags,
    suppressedTags,
    suppressedCount: suppressedTags.length,
    isLoading,
    isSyncing,
    hasConflicts,
    error,
    refresh
  };
};

/**
 * Filter raw learned_facts using safe tags logic (for fallback/offline mode)
 * Only use this when API is unavailable
 */
export const filterUnsafeTags = (learnedFacts = []) => {
  // Group by normalized entity
  const entityHealth = new Map();
  const entityPrefs = new Map();
  
  const normalizeEntity = (content) => {
    if (!content) return '';
    let entity = content.toLowerCase().trim();
    // Handle common patterns
    const patterns = [
      /allergic to (\w+)/,
      /loves? (\w+)/,
      /(\w+) treats?/,
    ];
    for (const p of patterns) {
      const m = entity.match(p);
      if (m) {
        entity = m[1];
        break;
      }
    }
    // Remove plurals
    if (entity.endsWith('s') && entity.length > 3) {
      entity = entity.slice(0, -1);
    }
    return entity;
  };
  
  const HEALTH_CATEGORIES = new Set(['health', 'allergy', 'medical', 'sensitivity', 'restriction']);
  const PREF_CATEGORIES = new Set(['loves', 'preferences', 'likes', 'favorites']);
  
  // First pass: find health restrictions
  learnedFacts.forEach(fact => {
    const cat = (fact.category || '').toLowerCase();
    const entity = normalizeEntity(fact.content);
    if (entity && HEALTH_CATEGORIES.has(cat)) {
      entityHealth.set(entity, true);
    }
    if (entity && PREF_CATEGORIES.has(cat)) {
      if (!entityPrefs.has(entity)) entityPrefs.set(entity, []);
      entityPrefs.get(entity).push(fact);
    }
  });
  
  // Second pass: filter out conflicting preferences
  const safe = [];
  const suppressed = [];
  
  learnedFacts.forEach(fact => {
    const cat = (fact.category || '').toLowerCase();
    const entity = normalizeEntity(fact.content);
    
    // Health tags always show
    if (HEALTH_CATEGORIES.has(cat)) {
      safe.push({ ...fact, is_health: true });
      return;
    }
    
    // Preference tags: check for health conflict
    if (PREF_CATEGORIES.has(cat) && entity && entityHealth.has(entity)) {
      suppressed.push({ 
        ...fact, 
        suppressed: true, 
        reason: `health_restriction_${entity}`,
        tooltip: `Hidden because there's a health restriction for ${entity}. Safety takes priority.`
      });
      return;
    }
    
    // No conflict
    safe.push({ ...fact, suppressed: false });
  });
  
  return { safe, suppressed };
};

/**
 * Clear cache for a specific pet (call after conflict resolution)
 */
export const invalidateSafeTagsCache = (petId) => {
  if (petId) {
    safeTagsCache.delete(petId);
  } else {
    safeTagsCache.clear();
  }
};

export default useSafeTags;
