/**
 * CelebrateConcierge.jsx
 * 
 * CTA card for the Celebrate Concierge® section.
 * Copy per Celebrate_Concierge®_MASTER.docx (all copy is final).
 * CTA button opens ConciergeIntakeModal with no pre-selected service.
 * 
 * Background: solid #0E0620 (dark). NOT a gradient.
 */

import React, { useState } from 'react';
import ConciergeIntakeModal from './ConciergeIntakeModal';
import { useConcierge } from '../../hooks/useConcierge';

const CelebrateConcierge = ({ pet, onAddToCart }) => {
  const [intakeOpen, setIntakeOpen] = useState(false);
  const petName = pet?.name || 'your pet';
  const { book } = useConcierge({ pet, pillar: 'celebrate' });

  return (
    <>
      <div
        style={{
          background: '#0E0620',
          borderRadius: 24,
          padding: '36px 32px',
          position: 'relative',
          overflow: 'hidden'
        }}
        data-testid="celebrate-concierge-cta"
      >
        {/* Subtle top-left glow */}
        <div style={{
          position: 'absolute', top: -60, left: -40,
          width: 200, height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,151,58,0.10) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Eyebrow chip */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(201,151,58,0.15)',
            border: '1px solid rgba(201,151,58,0.35)',
            borderRadius: 9999,
            padding: '5px 16px',
            marginBottom: 20
          }}>
            <span style={{ fontSize: 11, color: '#C9973A' }}>★</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(201,151,58,0.90)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Mojo's Concierge®
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 900,
            color: '#FFFFFF',
            fontFamily: 'Georgia, serif',
            marginBottom: 14,
            lineHeight: 1.25,
            maxWidth: 520
          }}>
            Celebrate <span style={{ color: '#F0C060' }}>{petName}</span> the way only you know how.
          </h2>

          {/* Description */}
          <p style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.65,
            marginBottom: 20,
            maxWidth: 540
          }}>
            45,000+ meals. Hundreds of birthdays. Every celebration we have ever planned has started the same way — with us listening to who your dog actually is.
          </p>

          {/* Chips — below description, above CTA */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {['Birthday Celebrations', 'Pawty Planning', 'Memory & Portraits', 'Milestone Marking', 'Surprise Deliveries'].map(chip => (
              <span
                key={chip}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.72)',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 9999,
                  padding: '4px 12px'
                }}
              >
                {chip}
              </span>
            ))}
          </div>

          {/* Stat + CTA row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Stat */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#F0C060', fontFamily: 'Georgia, serif', lineHeight: 1 }}>45,000+</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>meals made with love</span>
            </div>
            <button
              onClick={() => {
                book({ service: `${petName}'s Celebration — Plan my birthday`, channel: 'celebrate_concierge_cta', urgency: 'high' });
                setIntakeOpen(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #C9973A, #F0C060)',
                color: '#1A0A00',
                border: 'none',
                borderRadius: 12,
                padding: '13px 28px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 150ms',
                whiteSpace: 'nowrap'
              }}
              data-testid="concierge-cta-button"
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,151,58,0.40)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              Plan {petName}'s Celebration →
            </button>

            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
              48h response promise
            </p>
          </div>
        </div>
      </div>

      {/* Intake Modal */}
      <ConciergeIntakeModal
        isOpen={intakeOpen}
        onClose={() => setIntakeOpen(false)}
        serviceType=""
        petName={petName}
        petId={pet?.id}
      />
    </>
  );
};

export default CelebrateConcierge;
