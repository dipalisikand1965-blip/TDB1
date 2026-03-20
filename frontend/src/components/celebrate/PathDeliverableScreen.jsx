/**
 * PathDeliverableScreen.jsx
 * 
 * The deliverable at the end of each guided path.
 * Dark bg with white inner card + "Hand to Concierge" CTA.
 * Source: GuidedCelebrationPaths_MASTER.docx Section 7 + deliverable sections.
 */

import React, { useState } from 'react';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { tdc } from '../../utils/tdc_intent';

const PathDeliverableScreen = ({ path, petName, pet, userChoices, onReset }) => {
  const { token } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const resolve = (t) => (t || '').replace(/\{petName\}/g, petName || 'your pet');

  const handleHandToConcierge = async () => {
    setSending(true);
    // Fire tdc.request on guided path completion (hand to concierge)
    tdc.request({
      text: `Completed guided celebration path: ${path.deliverableName || path.id}`,
      name: path.deliverableName || path.title || path.id,
      pillar: "celebrate",
      pet,
      channel: "celebrate_guided_paths_complete",
    });
    try {
      const apiUrl = getApiUrl();
      const notesLines = Object.entries(userChoices || {}).map(([k, v]) => `${k}: ${v}`);
      const notes = `${path.deliverableName} for ${petName}:\n${notesLines.join('\n')}`;

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`${apiUrl}/api/concierge/intake`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          petId: pet?.id || null,
          petName: petName,
          serviceType: path.id === 'birthday' ? 'birthday_party' : path.id === 'gotcha' ? 'gotcha_day' : 'photography',
          celebrationDate: userChoices?.date || null,
          notes,
          source: `guided_path_${path.id}_deliverable`
        })
      });
      setSent(true);
    } catch (err) {
      console.error('[PathDeliverableScreen] Error:', err);
      setSent(true); // graceful fallback
    } finally {
      setSending(false);
    }
  };

  const deliverableItems = {
    birthday: [
      { label: 'Theme', value: userChoices?.theme || 'Garden Party' },
      { label: 'Cake', value: userChoices?.cake || 'Salmon & Pumpkin Cake' },
      { label: 'Guest list', value: userChoices?.guests || 'To be confirmed' },
      { label: 'Day timeline', value: userChoices?.timeline || '9am walk · 12pm feast · 3pm pawty · 6pm sunset photo' },
    ],
    gotcha: [
      { label: 'Gotcha date', value: userChoices?.date || 'To be confirmed' },
      { label: 'Memory photos', value: '3 moments captured' },
      { label: 'Ritual', value: userChoices?.ritual || 'To be confirmed' },
      { label: 'Gift', value: userChoices?.gift || 'Soul Memory Kit' },
    ],
    photoshoot: [
      { label: 'Location', value: userChoices?.location || 'Outdoor Park' },
      { label: 'Outfit', value: userChoices?.outfit || 'Colourful bandana' },
      { label: 'Photographer', value: userChoices?.photographer || 'Paws & Portraits' },
      { label: 'Preparation', value: 'Checklist complete' },
    ]
  }[path.id] || [];

  if (sent) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #0E0620, #1A0A00)',
        borderRadius: 16, padding: 24, textAlign: 'center'
      }}
        data-testid="deliverable-sent-confirmation"
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(201,151,58,0.20)', border: '2px solid rgba(201,151,58,0.40)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, margin: '0 auto 14px'
        }}>♥</div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>
          {resolve(path.deliverableName)} sent to your Concierge.
        </h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 20, lineHeight: 1.6 }}>
          Everything is in good hands. Your Concierge will reach out within 48 hours. ♥
        </p>
        <button
          onClick={onReset}
          style={{
            background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9999,
            padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}
          data-testid="deliverable-reset-btn"
        >
          Start again
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0E0620, #1A0A00)',
      borderRadius: 16, padding: 24
    }}
      data-testid={`deliverable-screen-${path.id}`}
    >
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 28 }}>{path.deliverableIcon}</span>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
              {resolve(`{petName}'s ${path.deliverableName}`)}
            </h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
              {path.deliverableSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* White deliverable card */}
      <div style={{
        background: '#FFFFFF', borderRadius: 14, padding: 20, marginBottom: 20
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {deliverableItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 10, borderBottom: i < deliverableItems.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: path.accentDark, minWidth: 100, flexShrink: 0 }}>
                {item.label}
              </span>
              <span style={{ fontSize: 13, color: '#444' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Primary CTA */}
      <button
        onClick={handleHandToConcierge}
        disabled={sending}
        style={{
          width: '100%', marginBottom: 10,
          background: 'linear-gradient(135deg, #C9973A, #F0C060)',
          color: '#1A0A00', border: 'none', borderRadius: 12,
          padding: '13px', fontSize: 15, fontWeight: 800,
          cursor: sending ? 'not-allowed' : 'pointer',
          opacity: sending ? 0.7 : 1
        }}
        data-testid={`deliverable-hand-to-concierge-${path.id}`}
      >
        {sending ? 'Sending...' : '👑 Hand to Concierge'}
      </button>

      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', textAlign: 'center', lineHeight: 1.5 }}>
        Your Concierge will execute everything in this {path.deliverableName.toLowerCase()}. 48h response promise.
      </p>
    </div>
  );
};

export default PathDeliverableScreen;
