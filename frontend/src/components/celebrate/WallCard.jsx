/**
 * WallCard.jsx
 * 
 * Individual community photo card for the Celebration Wall.
 * Spec: CelebrationWall_MASTER.docx Section 3 — ALL DETAILS ARE FINAL.
 * 
 * Width: 220px desktop · Photo: 200px object-top · Frosted glass tag
 * Heart: top-right circle with pop animation · Mira comment on own photo
 */

import React, { useState } from 'react';

const CELEBRATION_ICONS = {
  'Birthday': '🎂', 'First Birthday': '🎂', 'Gotcha Day': '🏠',
  'Milestone': '✨', 'Photoshoot': '📸', 'Pawty': '🎉', 'Just because': '💕'
};

const WallCard = ({ photo, isOwn, liked, onLike, onClick }) => {
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [hovered, setHovered] = useState(false);

  const celebIcon = CELEBRATION_ICONS[photo.occasion || photo.celebrationType] || '🐾';
  const celebLabel = photo.occasion || photo.celebrationType || 'Birthday';

  const handleLike = (e) => {
    e.stopPropagation();
    setHeartAnimating(true);
    setTimeout(() => setHeartAnimating(false), 220);
    onLike(photo.id);
  };

  return (
    <div
      onClick={() => onClick(photo)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 220, flexShrink: 0,
        borderRadius: 16, overflow: 'hidden',
        background: '#FFFFFF',
        border: '1px solid #F0E8E0',
        cursor: 'pointer',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
        scrollSnapAlign: 'start'
      }}
      data-testid={`wall-card-${photo.id}`}
    >
      {/* Photo area */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: '#f5f0ff' }}>
        <img
          src={photo.imageUrl || photo.image_url}
          alt={`${photo.petName || photo.pet_name}'s ${celebLabel}`}
          loading="lazy"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
            display: 'block'
          }}
          onError={(e) => { e.target.src = 'https://thedoggybakery.com/cdn/shop/files/zippy-april-4-1024x1024.png?v=1759752249&width=800'; }}
        />

        {/* Pending review overlay */}
        {photo.isPendingReview && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{
              background: 'rgba(255,255,255,0.92)', borderRadius: 9999,
              padding: '4px 12px', fontSize: 11, fontWeight: 600, color: '#444'
            }}>Pending review</span>
          </div>
        )}

        {/* Celebration type tag — frosted glass */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(4px)',
          borderRadius: 9999, padding: '4px 10px',
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 600, color: '#1A0030'
        }}>
          <span>{celebIcon}</span>
          <span>{celebLabel}</span>
        </div>

        {/* Heart button — top right */}
        <button
          onClick={handleLike}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
            transition: 'transform 200ms ease',
            transform: heartAnimating ? 'scale(1.3)' : 'scale(1)'
          }}
          data-testid={`wall-like-${photo.id}`}
        >
          <span style={{ color: liked ? '#E91E8C' : '#CCCCCC' }}>
            {liked ? '♥' : '♡'}
          </span>
        </button>
      </div>

      {/* Card body */}
      <div style={{ padding: 12 }}>
        {/* Name + timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#1A0030', flex: 1 }}>
            {photo.petName || photo.pet_name}
          </span>
          <span style={{ fontSize: 12, color: '#AAAAAA', marginLeft: 8, flexShrink: 0 }}>
            {photo.timeAgo || photo.date}
          </span>
        </div>

        {/* Caption */}
        <p style={{
          fontSize: 13, color: '#444', lineHeight: 1.55,
          margin: '0 0 10px',
          display: '-webkit-box', WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {photo.caption}
        </p>

        {/* Mira comment — only on own photo */}
        {isOwn && photo.miraComment && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 6,
            padding: '6px 0', marginBottom: 6,
            borderTop: '1px solid #FFE4F3'
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 3,
              background: 'linear-gradient(135deg,#E91E8C,#C44DFF)'
            }} />
            <p style={{ fontSize: 12, fontStyle: 'italic', color: '#E91E8C', margin: 0, lineHeight: 1.4 }}>
              <strong style={{ fontStyle: 'normal', fontWeight: 600 }}>✦ Mira: </strong>
              {photo.miraComment}
            </p>
          </div>
        )}

        {/* Footer: heart count + city */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#E91E8C' }}>
            ♥ {(photo.likes || photo.hearts || 0) + (liked ? 1 : 0)}
          </span>
          <span style={{ fontSize: 12, color: '#888' }}>
            📍 {photo.location || photo.city || 'India'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WallCard;
