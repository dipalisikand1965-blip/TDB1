/**
 * WallUploadCard.jsx
 * 
 * The first card in the Celebration Wall — the "Share Your Story" invite.
 * Spec: CelebrationWall_MASTER.docx Section 4.
 * 
 * Dashed pink border · camera icon · personalised subtitle · "Add Photo" button
 */

import React, { useState } from 'react';

const WallUploadCard = ({ petName, hasSubmitted, onAddPhoto }) => {
  const [hovered, setHovered] = useState(false);
  const displayName = petName || 'your pet';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 220, flexShrink: 0,
        minHeight: 320,
        borderRadius: 16,
        background: 'linear-gradient(135deg, #FFF0F8, #F9F0FF)',
        border: `2px dashed ${hovered ? '#E91E8C' : '#F0AADD'}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 24, textAlign: 'center', gap: 12,
        transition: 'border-color 200ms',
        scrollSnapAlign: 'start',
        cursor: hasSubmitted ? 'default' : 'pointer'
      }}
      data-testid="wall-upload-card"
    >
      {/* Camera icon box */}
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'linear-gradient(135deg, #E91E8C, #C44DFF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26
      }}>
        📷
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1A0030', margin: 0 }}>
        Share Your Story
      </h3>

      {/* Subtitle — personalised */}
      <p style={{ fontSize: 13, color: '#888', lineHeight: 1.5, margin: 0 }}>
        {petName
          ? `Show the world how ${displayName} celebrates`
          : 'Celebrate your pet\'s special moments with our community'}
      </p>

      {/* CTA button */}
      {!hasSubmitted ? (
        <button
          onClick={onAddPhoto}
          style={{
            background: 'linear-gradient(135deg, #E91E8C, #C44DFF)',
            color: '#FFFFFF', border: 'none', borderRadius: 9999,
            padding: '8px 18px', fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 150ms',
            transform: hovered ? 'translateY(-1px)' : 'none',
            opacity: hovered ? 0.9 : 1
          }}
          data-testid="wall-add-photo-btn"
        >
          ✦ Add Photo
        </button>
      ) : (
        <div style={{
          background: '#F0FDF4', color: '#166534',
          border: '1px solid #BBF7D0',
          borderRadius: 9999, padding: '6px 14px',
          fontSize: 12, fontWeight: 600
        }}>
          ✓ Shared
        </div>
      )}
    </div>
  );
};

export default WallUploadCard;
