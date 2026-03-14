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
          fontSize: '2rem',
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
    </section>
  );
};

export default GuidedCelebrationPaths;
