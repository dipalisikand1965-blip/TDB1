/**
 * CelebrateServiceGrid.jsx
 * 
 * 8-card service grid for Celebrate Concierge® section.
 * Fetches watercolour illustrations from the DB API (preserve exactly).
 * Uses spec-mandated copy (title, description, CTA) from the master spec doc.
 * 
 * Spec: 4-col desktop, 2-col tablet, 1-col mobile. Gap: 16px.
 * Header: "Celebrate, Personally" (Georgia 2rem) + subtitle.
 */

import React, { useState, useEffect } from 'react';
import CelebrateServiceCard from './CelebrateServiceCard';
import ConciergeIntakeModal from './ConciergeIntakeModal';
import { getApiUrl } from '../../utils/api';

// ─── Spec-mandated card data (ALL COPY IS FINAL per Celebrate_Concierge_MASTER.docx) ───
// Descriptions use {petName} placeholder replaced at render time.
const CARD_SPECS = [
  {
    serviceType: 'birthday_party',
    subLabel: 'BIRTHDAY',
    title: 'Birthday Party Planning',
    description: "From theme to table. Tell us the one word you want {petName}'s birthday to feel like. We'll build the whole day around it.",
    ctaText: "Plan {petName}'s birthday →"
  },
  {
    serviceType: 'photography',
    subLabel: 'PHOTOSHOOT',
    title: 'Professional Pet Photography',
    description: 'Studio or outdoors. A photograph taken on the right day, in the right light, with the right person holding the lead.',
    ctaText: 'Book a shoot →'
  },
  {
    serviceType: 'custom_cake',
    subLabel: 'CAKE',
    title: 'Custom Cake Consultation',
    description: "One-on-one with our baker. {petName}'s allergies. {petName}'s favourite flavour. A cake designed around who they actually are.",
    ctaText: 'Start the consultation →'
  },
  {
    serviceType: 'pawty',
    subLabel: 'THE FULL DAY',
    title: 'Pawty — The Full Day',
    description: "Cake, treats, photoshoot, decorations, coordination — everything handled so you can just be there with {petName}.",
    ctaText: 'Plan the pawty →'
  },
  {
    serviceType: 'gotcha_day',
    subLabel: 'GOTCHA DAY',
    title: 'Gotcha Day Celebration',
    description: "The day {petName} chose you. A quieter, more personal kind of celebration. For the anniversary that only you and {petName} know the meaning of.",
    ctaText: 'Celebrate the day →'
  },
  {
    serviceType: 'surprise_delivery',
    subLabel: 'SURPRISE',
    title: 'Surprise Delivery',
    description: "They won't see it coming. A box arrives. {petName} doesn't know what's in it. Neither does anyone else — until the moment it opens.",
    ctaText: 'Send a surprise →'
  },
  {
    serviceType: 'milestone',
    subLabel: 'MILESTONE',
    title: 'Milestone Celebration',
    description: "First birthday. Tenth. Adoption anniversary. Some days deserve more than a cake. Tell us which milestone — we'll make it permanent.",
    ctaText: 'Mark the milestone →'
  },
  {
    serviceType: 'venue',
    subLabel: 'VENUE',
    title: 'Pet-Friendly Venue Booking',
    description: "The right place for {petName}. We find venues that actually welcome dogs — not just allow them. There is a difference, and we know it.",
    ctaText: 'Find the venue →'
  }
];

const CelebrateServiceGrid = ({ pet }) => {
  const [illustrations, setIllustrations] = useState([]);
  const [intakeModal, setIntakeModal] = useState({ open: false, serviceType: '' });
  const petName = pet?.name || 'your pet';

  // Fetch illustrations from DB (preserve exactly — do not modify URLs)
  useEffect(() => {
    const fetchIllustrations = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/service-box/services?pillar=celebrate&limit=8&is_active=true`);
        if (res.ok) {
          const data = await res.json();
          const services = data.services || [];
          // Extract illustration URLs in order (first 8 match spec card order)
          const urls = services.slice(0, 8).map(s =>
            s.image_url || s.watercolor_image || s.image || ''
          );
          setIllustrations(urls);
        }
      } catch (err) {
        console.error('[CelebrateServiceGrid] Could not fetch illustrations:', err);
      }
    };
    fetchIllustrations();
  }, []);

  const resolveCopy = (text) => text.replace(/\{petName\}/g, petName);

  const openIntake = (serviceType) => {
    setIntakeModal({ open: true, serviceType });
  };

  return (
    <section
      style={{ padding: '0 0 48px' }}
      data-testid="celebrate-service-grid"
    >
      {/* Section Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 style={{
          fontSize: 'clamp(1.3rem, 5vw, 2rem)',
          fontWeight: 800,
          color: '#1A0030',
          fontFamily: 'Georgia, serif',
          marginBottom: 8,
          lineHeight: 1.2
        }}>
          Celebrate, Personally
        </h2>
        <p style={{
          fontSize: 14,
          color: '#888',
          marginTop: 6
        }}>
          Tell us what you want {petName}'s day to feel like. We'll do the rest.
        </p>
      </div>

      {/* Mobile: horizontal scroll carousel / Tablet: 2-col / Desktop: 4-col */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}
        className="service-grid-responsive"
      >
        {CARD_SPECS.map((spec, idx) => (
          <CelebrateServiceCard
            key={spec.serviceType}
            illustration={illustrations[idx] || ''}
            subLabel={spec.subLabel}
            title={spec.title}
            description={resolveCopy(spec.description)}
            ctaText={resolveCopy(spec.ctaText)}
            onCta={() => openIntake(spec.serviceType)}
          />
        ))}
      </div>

      {/* Intake Modal */}
      <ConciergeIntakeModal
        isOpen={intakeModal.open}
        onClose={() => setIntakeModal({ open: false, serviceType: '' })}
        serviceType={intakeModal.serviceType}
        petName={petName}
        petId={pet?.id}
      />
    </section>
  );
};

export default CelebrateServiceGrid;
