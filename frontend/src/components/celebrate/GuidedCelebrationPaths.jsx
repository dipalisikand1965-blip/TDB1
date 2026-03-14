/**
 * GuidedCelebrationPaths.jsx
 * 
 * Section: "Guided celebration paths"
 * 3 path cards + inline expansion panels with sequential steps + deliverables.
 * Source: GuidedCelebrationPaths_MASTER.docx — ALL COPY IS FINAL.
 * 
 * Architecture:
 *   - 3-col CSS grid (desktop) / 2-col (tablet) / 1-col (mobile)
 *   - Expansion panel spans all columns (grid-column: 1 / -1)
 *   - One expansion open at a time
 *   - Click same card to close
 */

import React, { useState } from 'react';
import { CELEBRATION_PATHS } from './celebrationPaths';
import GuidedPathCard from './GuidedPathCard';
import GuidedPathExpansion from './GuidedPathExpansion';

const GuidedCelebrationPaths = ({ pet }) => {
  const [expandedId, setExpandedId] = useState(null);

  const handleToggle = (pathId) => {
    setExpandedId(prev => (prev === pathId ? null : pathId));
  };

  return (
    <section
      style={{ padding: '0 0 48px', background: 'transparent' }}
      data-testid="guided-celebration-paths"
    >
      {/* Section Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontSize: 'clamp(1.3rem, 5vw, 2rem)',
          fontWeight: 800,
          color: '#1A0030',
          marginBottom: 6,
          lineHeight: 1.2
        }}>
          Guided celebration paths
        </h2>
        <p style={{ fontSize: 14, color: '#666', marginTop: 6, lineHeight: 1.5 }}>
          Mira walks you through every step. Each path ends with a plan you can keep.
        </p>
      </div>

      {/* 3-column grid — cards + expansion panel */}
      <div
        style={{ display: 'grid', gap: 16 }}
        className="guided-paths-grid"
      >
        {/* ── 3 path cards ── */}
        {CELEBRATION_PATHS.map((path) => (
          <GuidedPathCard
            key={path.id}
            path={path}
            isExpanded={expandedId === path.id}
            onToggle={() => handleToggle(path.id)}
            petName={pet?.name}
          />
        ))}

        {/* ── Expansion panels — render for all 3 but only one is open ── */}
        {CELEBRATION_PATHS.map((path) => (
          <GuidedPathExpansion
            key={`expansion-${path.id}`}
            path={path}
            isOpen={expandedId === path.id}
            onClose={() => setExpandedId(null)}
            pet={pet}
          />
        ))}
      </div>
      {/* ── Mobile floating close button — appears when any path is expanded ── */}
      {expandedId !== null && (
        <div className="md:hidden fixed bottom-[90px] left-1/2 -translate-x-1/2 z-[9990]">
          <button
            onClick={() => setExpandedId(null)}
            style={{
              background: '#1A0030', color: '#fff',
              border: 'none', borderRadius: 9999,
              padding: '12px 28px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', gap: 8
            }}
            data-testid="guided-path-mobile-close"
          >
            ✕ Close guide
          </button>
        </div>
      )}
    </section>
  );
};

export default GuidedCelebrationPaths;
