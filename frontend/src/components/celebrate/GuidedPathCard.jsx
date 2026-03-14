/**
 * GuidedPathCard.jsx
 * 
 * Individual path card — yellow / green / pink pastel background,
 * icon box, title, description, step chips (+2 more), chevron.
 * Source: GuidedCelebrationPaths_MASTER.docx Section 2 + 3
 */

import React from 'react';

const GuidedPathCard = ({ path, isExpanded, onToggle, petName }) => {
  const resolve = (text) => (text || '').replace(/\{petName\}/g, petName || 'your pet');

  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      style={{
        position: 'relative',
        borderRadius: 20,
        padding: 24,
        cursor: 'pointer',
        background: path.bg,
        border: isExpanded ? `2px solid ${path.accent}` : '2px solid transparent',
        boxShadow: isExpanded ? `0 0 0 4px ${path.accentAlpha12}` : 'none',
        transition: 'transform 200ms ease, box-shadow 200ms ease, border 200ms ease',
        minHeight: 220
      }}
      className="guided-path-card"
      data-testid={`guided-path-card-${path.id}`}
      onMouseEnter={(e) => {
        if (!isExpanded) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isExpanded) {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = isExpanded ? `0 0 0 4px ${path.accentAlpha12}` : 'none';
        }
      }}
    >
      {/* Icon box */}
      <div style={{
        width: 52, height: 52,
        borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26,
        background: path.accentAlpha20,
        marginBottom: 16
      }}>
        {path.icon}
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 18, fontWeight: 800, color: '#1A0030', marginBottom: 8
      }}>
        {path.title}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 16, minHeight: 60
      }}>
        {resolve(path.description)}
      </p>

      {/* Step chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
        {path.visibleSteps.map((step, i) => (
          <span
            key={i}
            style={{
              borderRadius: 9999,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 500,
              background: path.accentAlpha15,
              color: path.accentDark
            }}
          >
            {resolve(step)}
          </span>
        ))}
        {path.hiddenSteps?.length > 0 && (
          <span style={{
            borderRadius: 9999,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 700,
            background: path.accentAlpha15,
            color: path.accent
          }}>
            +{path.hiddenSteps.length} more
          </span>
        )}
      </div>

      {/* Chevron */}
      <span style={{
        position: 'absolute',
        bottom: 18, right: 20,
        fontSize: 20,
        color: isExpanded ? path.accent : path.accentAlpha50,
        transition: 'transform 200ms ease, color 200ms ease',
        transform: isExpanded ? 'rotate(90deg)' : 'none',
        userSelect: 'none'
      }}>
        ›
      </span>
    </div>
  );
};

export default GuidedPathCard;
