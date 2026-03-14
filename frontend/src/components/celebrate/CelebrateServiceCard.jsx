/**
 * CelebrateServiceCard.jsx
 * 
 * Individual card for the Celebrate Concierge® service grid.
 * Spec: illustration (180px, object-top), sub-label (gold uppercase),
 * title, description, CTA link → opens intake modal.
 */

import React, { useState } from 'react';

const CelebrateServiceCard = ({ illustration, subLabel, title, description, ctaText, onCta }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onCta}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        border: '1px solid #F0E8E0',
        background: '#FFFFFF',
        transition: 'all 200ms ease',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.08)' : 'none'
      }}
      data-testid={`service-card-${subLabel?.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Illustration */}
      <div style={{ height: 180, overflow: 'hidden', background: '#FAF5F0' }}>
        {illustration ? (
          <img
            src={illustration}
            alt={title}
            loading="lazy"
            style={{
              width: '100%',
              height: '180px',
              objectFit: 'cover',
              objectPosition: 'center top',
              display: 'block'
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #FFF3E0, #FFCCBC)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40
            }}
          >
            🐾
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: 16 }}>
        {/* Sub-label */}
        {subLabel && (
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#C9973A',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 6
          }}>
            {subLabel}
          </p>
        )}

        {/* Title */}
        <h3 style={{
          fontSize: 15,
          fontWeight: 800,
          color: '#1A0030',
          marginBottom: 6,
          lineHeight: 1.3
        }}>
          {title}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: 13,
          color: '#666666',
          lineHeight: 1.55,
          marginBottom: 14,
          minHeight: 52
        }}>
          {description}
        </p>

        {/* CTA Link */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            fontWeight: 700,
            color: '#C9973A',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            transition: 'transform 150ms'
          }}
          data-testid={`service-card-cta-${subLabel?.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {/* ctaText already contains → — no extra arrow needed */}
          <span style={{
            display: 'inline-block',
            transition: 'transform 150ms',
            transform: hovered ? 'translateX(3px)' : 'translateX(0)'
          }}>{ctaText}</span>
        </button>
      </div>
    </div>
  );
};

export default CelebrateServiceCard;
