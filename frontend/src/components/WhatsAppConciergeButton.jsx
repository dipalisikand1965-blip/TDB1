/**
 * WhatsAppConciergeButton.jsx
 *
 * A small green WhatsApp button that drops into any Concierge® modal/header.
 * - Pulls the member-services number from /api/config/member-whatsapp
 *   (single source of truth, never hardcoded)
 * - Pre-fills a context-rich greeting (member, pet, page) so when Concierge®
 *   reads the message in Gupshup, they know exactly who/what/where.
 * - Uses the shared waLink helper so desktop opens web.whatsapp.com directly
 *   (avoids the api.whatsapp.com block) and mobile opens wa.me native.
 *
 * Usage:
 *   <WhatsAppConciergeButton pet={activePet} pillar={pillar} />
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { waLink } from '../utils/whatsappLink';

const API = process.env.REACT_APP_BACKEND_URL;

const WhatsAppConciergeButton = ({ pet, pillar, label = '💬 WhatsApp', size = 'sm', testId = 'whatsapp-concierge-btn' }) => {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');

  useEffect(() => {
    let alive = true;
    fetch(`${API}/api/config/member-whatsapp`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data?.configured) setPhone(data.phone);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!phone) return null;

  const memberLabel = user?.name
    ? `${user.name}${user.id ? ` (Member ${String(user.id).slice(-6).toUpperCase()})` : ''}`
    : 'a member';
  const pageLabel = pillar
    ? `${pillar.charAt(0).toUpperCase()}${pillar.slice(1)}`
    : 'the site';
  const petLabel = pet?.name ? ` for ${pet.name}` : '';

  const message = `Hi! I'm ${memberLabel}, writing from the ${pageLabel} page. I need help${petLabel}.`;
  const href = waLink(phone, message);

  const padding = size === 'sm' ? '6px 12px' : '10px 16px';
  const fontSize = size === 'sm' ? 12 : 14;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      data-testid={testId}
      aria-label="Chat with Concierge® on WhatsApp"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: '#25D366',
        color: '#fff',
        border: 'none',
        borderRadius: 20,
        padding,
        fontSize,
        fontWeight: 700,
        textDecoration: 'none',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(37,211,102,0.30)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 10px rgba(37,211,102,0.40)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(37,211,102,0.30)';
      }}
    >
      {label}
    </a>
  );
};

export default WhatsAppConciergeButton;
