/**
 * Pet Soul Score Hook
 * Fetches score data from the server-side API (single source of truth)
 */
import { useState, useEffect, useCallback } from 'react';
import { API_URL } from './api';

export const usePetScore = (petId, token = null) => {
  const [scoreState, setScoreState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchScoreState = useCallback(async () => {
    if (!petId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(`${API_URL}/api/pet-score/${petId}/score_state`, { headers });
      
      if (!response.ok) {
        throw new Error('Failed to fetch score state');
      }
      
      const data = await response.json();
      setScoreState(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching pet score:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [petId, token]);

  useEffect(() => {
    fetchScoreState();
  }, [fetchScoreState]);

  return {
    scoreState,
    loading,
    error,
    refetch: fetchScoreState,
    // Convenience accessors
    score: scoreState?.score || 0,
    tier: scoreState?.tier || null,
    nextTier: scoreState?.next_tier || null,
    categories: scoreState?.categories || {},
    stats: scoreState?.stats || { answered: 0, total: 0, completion_percentage: 0 },
    recommendations: scoreState?.recommendations || { next_question: null, high_impact_missing: [] }
  };
};


/**
 * Fetch quick questions for a pet
 */
export const fetchQuickQuestions = async (petId, limit = 5, token = null) => {
  try {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(
      `${API_URL}/api/pet-score/${petId}/quick-questions?limit=${limit}`,
      { headers }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch quick questions');
    }
    
    return await response.json();
  } catch (err) {
    console.error('Error fetching quick questions:', err);
    return { questions: [], current_score: 0, potential_boost: 0 };
  }
};


/**
 * Fetch all tier definitions
 */
export const fetchScoreTiers = async () => {
  try {
    const response = await fetch(`${API_URL}/api/pet-score/tiers`);
    if (!response.ok) throw new Error('Failed to fetch tiers');
    return await response.json();
  } catch (err) {
    console.error('Error fetching score tiers:', err);
    return { tiers: {}, tier_order: [] };
  }
};


/**
 * Recalculate a pet's score (call after bulk answer updates)
 */
export const recalculatePetScore = async (petId, token) => {
  try {
    const response = await fetch(`${API_URL}/api/pet-score/${petId}/recalculate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to recalculate score');
    return await response.json();
  } catch (err) {
    console.error('Error recalculating score:', err);
    return { success: false, error: err.message };
  }
};


export default usePetScore;
