/**
 * DiningConciergeServices.jsx
 * 4 illustrated service cards + dark CTA block
 * Shown on both tabs — the human concierge layer above Mira's self-serve
 */

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useResizeMobile } from '../../hooks/useResizeMobile';

const SERVICES = [
  {
    id: 'restaurant-discovery',
    icon: '🗺️',
    title: 'Restaurant Discovery',
    description: 'Mira finds and vets pet-friendly restaurants near you — filtered by outdoor seating, water bowls, and dog policies.',
    cta: 'Find restaurants',
    color: '#C44400',
    prompt: (name) => `Find pet-friendly restaurants near me for ${name}`,
  },
  {
    id: 'reservation-assistance',
    icon: '📅',
    title: 'Reservation Assistance',
    description: 'Need help making a reservation at a pet-friendly venue? We coordinate the details so you and your dog arrive welcome.',
    cta: 'Get help',
    color: '#E86A00',
    prompt: (name) => `Help me make a pet-friendly restaurant reservation for ${name}`,
  },
  {
    id: 'dining-etiquette',
    icon: '🎓',
    title: 'Dining Etiquette Guide',
    description: 'Everything from how to settle your dog under the table to what to order from the menu that is safe for them.',
    cta: 'Learn etiquette',
    color: '#D14900',
    prompt: (name) => `What is the etiquette for dining out with ${name}`,
  },
  {
    id: 'venue-suitability',
    icon: '✅',
    title: 'Venue Suitability Check',
    description: 'Share a restaurant link or name. Mira checks their dog policy, outdoor access, and whether the space suits your dog\'s temperament.',
    cta: 'Check a venue',
    color: '#8B3A0A',
    prompt: (name) => `Check if a restaurant is suitable for dining with ${name}`,
  },
];

const ServiceCard = ({ svc, petName }) => {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: { message: svc.prompt(petName), context: 'dine' },
    }));
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${svc.color}22`,
        borderRadius: 18, padding: '20px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
      data-testid={`dining-concierge-${svc.id}`}
    >
      <span style={{ fontSize: 28 }}>{svc.icon}</span>
      <div>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#1A0A00', marginBottom: 6 }}>{svc.title}</p>
        <p style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{svc.description}</p>
      </div>
      <button
        onClick={handleClick}
        style={{
          marginTop: 'auto',
          background: svc.color, color: '#fff',
          border: 'none', borderRadius: 20, padding: '10px 18px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%',
        }}
      >
        <MessageCircle size={14} />
        {svc.cta}
      </button>
    </div>
  );
};

const DiningConciergeCTA = ({ petName }) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #1A0A00 0%, #3d1200 60%, #7a2800 100%)',
      borderRadius: 20, padding: '28px 24px',
      display: 'flex', flexDirection: 'column', gap: 14,
      marginTop: 24,
    }}
    data-testid="dining-concierge-cta"
  >
    <div>
      <p style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 6 }}>
        Dine Concierge®
      </p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', lineHeight: 1.5 }}>
        Everything from finding the right food to finding the right restaurant — Mira and the concierge team handle it. You just show up with {petName}.
      </p>
    </div>
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI', { detail: { message: `I need concierge help with ${petName}'s dining`, context: 'dine' } }))}
      style={{
        background: '#C44400', color: '#fff',
        border: 'none', borderRadius: 20, padding: '12px 24px',
        fontSize: 14, fontWeight: 700, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
      }}
    >
      <MessageCircle size={16} />
      Talk to Mira
    </button>
  </div>
);

const DiningConciergeServices = ({ pet }) => {
  const isMobile = useResizeMobile();
  const petName = pet?.name || 'your dog';

  return (
    <div data-testid="dining-concierge-services">
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A0A00', marginBottom: 2 }}>Dining Concierge®</h2>
        <p style={{ fontSize: 13, color: '#888' }}>The human layer behind Mira — for when you need more</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(2, 1fr)',
        gap: 12,
      }}>
        {SERVICES.map(svc => (
          <ServiceCard key={svc.id} svc={svc} petName={petName} />
        ))}
      </div>

      <DiningConciergeCTA petName={petName} />
    </div>
  );
};

export default DiningConciergeServices;
