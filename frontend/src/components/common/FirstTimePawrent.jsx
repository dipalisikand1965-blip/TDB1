/**
 * FirstTimePawrent.jsx
 * Warm, reassuring card for first-time dog parents
 * Shows on Adopt (stage: thinking/ready) and Care pillar
 * One tap → opens ConciergeRequestBuilder with lifestage pre-filled
 */
import { useState } from 'react';
import ConciergeRequestBuilder from '../services/ConciergeRequestBuilder';

const CHECKLIST = [
  { icon: '🏥', text: 'Vet registration — book within 48 hours of arrival' },
  { icon: '🍽️', text: 'Feeding schedule — we set it up for your breed' },
  { icon: '🛏️', text: 'Safe space — bed, crate or quiet corner ready' },
  { icon: '🌙', text: 'First night guide — what to expect hour by hour' },
  { icon: '🚨', text: 'Emergency contacts — saved before you need them' },
  { icon: '🐾', text: 'Week one routine — walks, play, rest, bonding' },
];

export default function FirstTimePawrent({ pet, token, accentColor = '#D4537E' }) {
  const [open, setOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const petName = pet?.name || 'your dog';
  const breed = (pet?.breed || '').split('(')[0].trim();

  return (
    <>
      <div style={{
        margin: '0 0 20px',
        background: 'linear-gradient(135deg,rgba(212,83,126,0.08),rgba(212,83,126,0.14))',
        border: `1.5px solid ${accentColor}30`,
        borderRadius: 20,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{ width: '100%', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            🐾
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1A0A2E', marginBottom: 2 }}>
              First time with a dog?
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.4 }}>
              We've got you — here's your week one plan
            </div>
          </div>
          <div style={{ fontSize: 20, color: accentColor, transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none' }}>›</div>
        </button>

        {/* Expanded */}
        {open && (
          <div style={{ padding: '0 18px 18px' }}>
            <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.6, marginBottom: 16 }}>
              {breed ? `${breed}s are wonderful first dogs.` : 'Every first dog is a life-changing moment.'} Mira has put together everything {petName} needs for a perfect start.
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              {CHECKLIST.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{item.text.replace('your breed', breed || 'your breed')}</span>
                </div>
              ))}
            </div>

            {/* Mira quote */}
            <div style={{ background: '#0A0A14', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: `${accentColor}`, letterSpacing: '0.1em', marginBottom: 6 }}>✦ MIRA SAYS</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, fontStyle: 'italic' }}>
                "The first week sets the tone for everything. I'll make sure {petName} feels safe, loved and at home from day one."
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setBuilderOpen(true)}
              data-testid="first-pawrent-cta-btn"
              style={{ width: '100%', minHeight: 48, borderRadius: 14, border: 'none', background: `linear-gradient(135deg,#0A0A14,${accentColor})`, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Build {petName}'s First Week Plan →
            </button>
          </div>
        )}
      </div>

      <ConciergeRequestBuilder
        pet={pet}
        token={token}
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        preselect="lifestage"
      />
    </>
  );
}
