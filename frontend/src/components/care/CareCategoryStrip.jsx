/**
 * CareCategoryStrip.jsx
 * Horizontal scrollable category strip for /care page.
 * Mirrors DineCategoryStrip architecture with sage green palette.
 */

import React from 'react';

const CARE_CATEGORIES = [
  { id: 'grooming',     icon: '✂️',  label: 'Grooming' },
  { id: 'dental',       icon: '🦷',  label: 'Dental & Paw' },
  { id: 'coat',         icon: '🌿',  label: 'Coat & Skin' },
  { id: 'wellness',     icon: '🏥',  label: 'Wellness' },
  { id: 'senior',       icon: '🌸',  label: 'Senior Care' },
  { id: 'supplements',  icon: '💊',  label: 'Supplements' },
  { id: 'soul',         icon: '✨',  label: 'Soul Care' },
  { id: 'mira',         icon: '🪄',  label: "Mira's Picks" },
];

const G = {
  sage:      '#40916C',
  deepMid:   '#2D6A4F',
  pale:      '#D8F3DC',
  cream:     '#F0FFF4',
  darkText:  '#1B4332',
  mutedText: '#52796F',
  border:    'rgba(45,106,79,0.18)',
};

const CareCategoryStrip = ({ onDimSelect, activeDim }) => {
  return (
    <div
      data-testid="care-category-strip"
      style={{
        background: '#fff',
        borderBottom: `1.5px solid ${G.border}`,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
      className="care-strip-scrollbar"
    >
      <style>{`.care-strip-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '10px 16px',
        width: 'max-content',
        minWidth: '100%',
      }}>
        {CARE_CATEGORIES.map(cat => {
          const isActive = activeDim === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onDimSelect && onDimSelect(isActive ? null : cat.id)}
              data-testid={`care-category-${cat.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 20,
                border: `1.5px solid ${isActive ? G.sage : G.border}`,
                background: isActive
                  ? `linear-gradient(135deg, ${G.sage}, ${G.deepMid})`
                  : G.cream,
                color: isActive ? '#fff' : G.mutedText,
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                boxShadow: isActive ? `0 2px 10px rgba(64,145,108,0.30)` : 'none',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = G.sage;
                  e.currentTarget.style.color = G.darkText;
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = G.border;
                  e.currentTarget.style.color = G.mutedText;
                }
              }}
            >
              <span style={{ fontSize: 14 }}>{cat.icon}</span>
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CareCategoryStrip;
