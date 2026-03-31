/**
 * ConciergeCTA — "Need something arranged?"
 * Floating dark banner with a single "Request →" button.
 * Opens ServiceBookingModal with the correct serviceType for each pillar.
 *
 * Usage:
 *   import ConciergeCTA from '../components/ConciergeCTA';
 *   <ConciergeCTA pillar="care" />
 */

import { useState } from 'react';
import ServiceBookingModal from './ServiceBookingModal';

// Map pillar name → the closest ServiceBookingModal serviceType key
const PILLAR_SERVICE_TYPE = {
  care:      'grooming',
  learn:     'training',
  emergency: 'vet',
  farewell:  'grooming',
  go:        'walking',
  play:      'daycare',
  dine:      'grooming',
  fit:       'daycare',
  stay:      'boarding',
  paperwork: 'grooming',
  adopt:     'grooming',
  celebrate: 'grooming',
};

export default function ConciergeCTA({ pillar = 'care', style = {} }) {
  const [open, setOpen] = useState(false);
  const serviceType = PILLAR_SERVICE_TYPE[pillar] || 'grooming';

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
        <ServiceBookingModal
          isOpen={open}
          onClose={() => setOpen(false)}
          serviceType={serviceType}
        />
      )}
    </>
  );
}
