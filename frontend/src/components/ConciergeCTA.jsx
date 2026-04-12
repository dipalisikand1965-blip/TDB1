/**
 * ConciergeCTA — "Need something arranged?"
 * Floating dark banner with a single "Request →" button.
 * Opens ServiceConciergeModal with pillar-specific options.
 *
 * Usage:
 *   import ConciergeCTA from '../components/ConciergeCTA';
 *   <ConciergeCTA pillar="care" pet={pet} />
 */

import { useState } from 'react';
import ServiceConciergeModal from './services/ServiceConciergeModal';

export default function ConciergeCTA({ pillar = 'care', pet = null, style = {} }) {
  const [open, setOpen] = useState(false);
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } })();

  return (
    <>
      <div
        data-testid="concierge-cta-banner"
        style={{
          background: 'linear-gradient(135deg, #1A0A2E, #2D1B69)',
          borderRadius: 16,
          padding: '16px 20px',
          margin: '16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          ...style,
        }}
      >
        <div>
          <p style={{ color: '#C9973A', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            ✦ Concierge®
          </p>
          <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '4px 0 0' }}>
            Need something arranged?
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '2px 0 0' }}>
            Our team handles everything for you
          </p>
        </div>
        <button
          data-testid="concierge-cta-request-btn"
          onClick={() => setOpen(true)}
          style={{
            background: '#14B8A6',
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Request →
        </button>
      </div>

      {open && (
        <ServiceConciergeModal
          service={{ pillar }}
          pet={pet}
          user={user}
          onClose={() => setOpen(false)}
          onBooked={() => setOpen(false)}
        />
      )}
    </>
  );
}
