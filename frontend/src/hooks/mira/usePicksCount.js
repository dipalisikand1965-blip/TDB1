// ─── usePicksCount.js ────────────────────────────────────────────────────────
// Bible §4.1 — PICKS tab badge must reflect real-time scored picks, not hardcoded
// Usage: const { picksCount, loading } = usePicksCount(petId, token)
//
// Drop into MiraDemoPage.jsx wherever the PICKS tab badge count is rendered
// Replace any hardcoded number with {picksCount}

import { useState, useEffect, useRef } from 'react';

const CACHE = {}; // In-memory cache per pet — avoids re-fetching on tab switch

export function usePicksCount(petId, token, minScore = 60) {
  const [picksCount, setPicksCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!petId || !token) return;

    // Return from cache immediately if available
    if (CACHE[petId] !== undefined) {
      setPicksCount(CACHE[petId]);
      return;
    }

    setLoading(true);
    abortRef.current = new AbortController();

    const fetchCount = async () => {
      try {
        // Try pre-computed scores first (fast path — Bible AGENT_START_HERE §1)
        const res = await fetch(
          `/api/mira/claude-picks/${petId}?min_score=${minScore}&limit=50`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: abortRef.current.signal,
          }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Count unique scored picks across all pillars
        const picks = data?.picks || data?.items || data || [];
        const count = Array.isArray(picks) ? picks.length : 0;

        CACHE[petId] = count;
        setPicksCount(count);
      } catch (err) {
        if (err.name === 'AbortError') return;

        // Fallback: try score-status endpoint
        try {
          const statusRes = await fetch(
            `/api/mira/score-status/${petId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (statusRes.ok) {
            const status = await statusRes.json();
            const count = status?.total_scored || status?.count || 0;
            CACHE[petId] = count;
            setPicksCount(count);
          }
        } catch {
          // Silent fail — badge just won't show
          setPicksCount(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCount();

    return () => {
      abortRef.current?.abort();
    };
  }, [petId, token, minScore]);

  return { picksCount, loading };
}

// ─── PicksBadge component ─────────────────────────────────────────────────────
// Drop into the PICKS tab in MiraOSNavigation or wherever the tab renders
// Replaces hardcoded "8" badge

export function PicksBadge({ petId, token }) {
  const { picksCount, loading } = usePicksCount(petId, token);

  if (loading || picksCount === null) return null;
  if (picksCount === 0) return null;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '18px',
      height: '18px',
      padding: '0 5px',
      borderRadius: '9px',
      background: 'linear-gradient(135deg, #C96D9E, #9B3F7A)',
      color: 'white',
      fontSize: '10px',
      fontWeight: 700,
      lineHeight: 1,
      marginLeft: '5px',
    }}>
      {picksCount > 99 ? '99+' : picksCount}
    </span>
  );
}

// ─── How to use in MiraDemoPage.jsx / MiraOSNavigation ───────────────────────
//
// BEFORE (hardcoded):
//   <span className="badge">8</span>
//
// AFTER (live):
//   import { PicksBadge } from './usePicksCount';
//   <PicksBadge petId={currentPet?.id} token={token} />
//
// OR if you want the raw number for tab rendering:
//   import { usePicksCount } from './usePicksCount';
//   const { picksCount } = usePicksCount(currentPet?.id, token);
//   // then use picksCount in your tab render
