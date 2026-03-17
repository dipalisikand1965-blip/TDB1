/**
 * CareConciergeSection.jsx
 * The Doggy Company — /care page
 *
 * "Care, Personally" section — mirrors DineConciergeSection.
 * Shows care services as illustrated cards from /api/service-box/services?pillar=care
 * Opens CareConciergeModal on card click.
 */

import React, { useEffect, useState } from 'react';
import CareConciergeModal from './CareConciergeModal';
import CelebrateServiceCard from '../celebrate/CelebrateServiceCard';
import { getApiUrl } from '../../utils/api';

const G = {
  sage:    '#40916C',
  deepMid: '#2D6A4F',
  deep:    '#1B4332',
  cream:   '#F0FFF4',
  border:  'rgba(45,106,79,0.18)',
};

const CareConciergeSection = ({ pet }) => {
  const [services,   setServices]  = useState([]);
  const [modalOpen,  setModalOpen] = useState(false);
  const [activeType, setActiveType] = useState('');

  const petName = pet?.name || 'your pet';
  const petId   = pet?.id;

  useEffect(() => {
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/api/service-box/services?pillar=care&limit=8&is_active=true`)
      .then(r => r.ok ? r.json() : { services: [] })
      .then(d => setServices(d.services || []))
      .catch(() => {});
  }, []);

  const handleCardClick = (svc) => {
    setActiveType(svc.service_type || svc.id || '');
    setModalOpen(true);
  };

  return (
    <>
      <CareConciergeModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setActiveType(''); }}
        serviceType={activeType}
        petName={petName}
        petId={petId}
      />

      <section style={{ marginBottom: 40 }}>
        {/* Section Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{
            fontSize: 'clamp(1.3rem, 5vw, 2rem)',
            fontWeight: 800, fontFamily: 'Georgia, serif',
            color: G.deep, marginBottom: 6, lineHeight: 1.2,
          }}>
            Care, Personally
          </h2>
          <p style={{ fontSize: 14, color: '#52796F', lineHeight: 1.6 }}>
            Every care moment for <span style={{ color: G.sage, fontWeight: 600 }}>{petName}</span> — concierge-arranged, exactly how you'd want it.
          </p>
        </div>

        {/* Service grid — 4 cols desktop, 2 cols mobile */}
        <style>{`
          .care-personally-grid { grid-template-columns: repeat(4, 1fr); }
          @media (max-width: 639px)  { .care-personally-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (min-width: 640px) and (max-width: 1023px) { .care-personally-grid { grid-template-columns: repeat(2, 1fr); } }
        `}</style>
        <div style={{ display: 'grid', gap: 16 }} className="care-personally-grid">
          {services.map(svc => (
            <CelebrateServiceCard
              key={svc.id || svc._id}
              illustration={svc.image_url || svc.watercolor_image || svc.illustration_url || ''}
              subLabel={svc.category || 'CARE'}
              title={svc.name}
              description={svc.short_description || svc.description || ''}
              ctaText={`Book ${petName}'s ${svc.name} →`}
              onCta={() => handleCardClick(svc)}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        {services.length > 0 && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              onClick={() => { setActiveType(''); setModalOpen(true); }}
              style={{
                background: `linear-gradient(135deg, ${G.sage}, ${G.deepMid})`,
                color: '#fff', border: 'none', borderRadius: 12,
                padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
              data-testid="care-personally-cta"
            >
              Talk to your Care Concierge →
            </button>
            <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
              48h response promise · Emergency care: within 5 minutes
            </p>
          </div>
        )}
      </section>
    </>
  );
};

export default CareConciergeSection;
