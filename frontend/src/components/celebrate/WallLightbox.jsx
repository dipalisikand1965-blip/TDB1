/**
 * WallLightbox.jsx
 * 
 * Full photo lightbox for Celebration Wall cards.
 * Spec: CelebrationWall_MASTER.docx Section 6.
 * 
 * Dark overlay · white card · full caption · Mira comment · prev/next nav
 */

import React from 'react';
import { useResizeMobile } from '../../hooks/useResizeMobile';

const CELEBRATION_ICONS = {
  'Birthday': '🎂', 'First Birthday': '🎂', 'Gotcha Day': '🏠',
  'Milestone': '✨', 'Photoshoot': '📸', 'Pawty': '🎉', 'Just because': '💕'
};

const WallLightbox = ({ photo, isOwn, liked, onLike, onClose, onPrev, onNext, hasPrev, hasNext }) => {
  const isMobile = useResizeMobile();
  if (!photo) return null;

  const celebLabel = photo.occasion || photo.celebrationType || 'Birthday';
  const celebIcon = CELEBRATION_ICONS[celebLabel] || '🐾';
  const heartCount = (photo.likes || photo.hearts || 0) + (liked ? 1 : 0);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.90)',
        zIndex: 3000,
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '72px 0 0' : '48px 16px 16px',
        overflowY: isMobile ? 'auto' : 'visible',
      }}
      data-testid="wall-lightbox-overlay"
    >
      {/* Close button — fixed top-right, always visible */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: 20, right: 20,
          width: 44, height: 44, borderRadius: '50%',
          background: '#FFFFFF',
          border: 'none',
          color: '#1A0030', fontSize: 22, fontWeight: 900,
          cursor: 'pointer', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1,
          boxShadow: '0 2px 12px rgba(0,0,0,0.30)'
        }}
        data-testid="lightbox-close"
      >✕</button>
      {/* Prev arrow */}
      {hasPrev && (
        <button onClick={e => { e.stopPropagation(); onPrev(); }} style={{
          position: 'absolute', left: 16,
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
          color: '#fff', fontSize: 22, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} data-testid="lightbox-prev">‹</button>
      )}

      {/* Content card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 520, width: '100%', background: '#FFFFFF',
          borderRadius: isMobile ? '20px 20px 0 0' : 20,
          overflow: 'hidden',
          maxHeight: isMobile ? 'none' : '85vh',
          overflowY: isMobile ? 'visible' : 'auto',
          position: 'relative'
        }}
        data-testid="wall-lightbox-card"
      >
        {/* Photo */}
        <div style={{ position: 'relative', background: '#F5F0FF' }}>
          <img
            src={photo.imageUrl || photo.image_url}
            alt={`${photo.petName || photo.pet_name}'s ${celebLabel}`}
            style={{
              width: '100%', maxHeight: 340,
              objectFit: 'contain', display: 'block'
            }}
            onError={(e) => { e.target.src = 'https://thedoggybakery.com/cdn/shop/files/zippy-april-4-1024x1024.png?v=1759752249&width=800'; }}
          />
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Celebration tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(233,30,140,0.10)', borderRadius: 9999,
            padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#E91E8C',
            marginBottom: 12
          }}>
            {celebIcon} {celebLabel}
          </div>

          {/* Dog name */}
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A0030', marginBottom: 4 }}>
            {photo.petName || photo.pet_name}
          </h3>

          {/* City + timestamp */}
          <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
            📍 {photo.location || photo.city || 'India'} · {photo.timeAgo || photo.date}
          </p>

          {/* Full caption — no truncation */}
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 16 }}>
            {photo.caption}
          </p>

          {/* Mira comment (own photo only) */}
          {isOwn && photo.miraComment && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '10px 12px', borderRadius: 10,
              background: '#FFF0F8', marginBottom: 16
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 3,
                background: 'linear-gradient(135deg,#E91E8C,#C44DFF)'
              }} />
              <p style={{ fontSize: 13, fontStyle: 'italic', color: '#E91E8C', margin: 0, lineHeight: 1.5 }}>
                <strong style={{ fontStyle: 'normal', fontWeight: 600 }}>✦ Mira: </strong>
                {photo.miraComment}
              </p>
            </div>
          )}

          {/* Heart count */}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#E91E8C', marginBottom: 14 }}>
            ♥ {heartCount}
          </div>

          {/* Love this button */}
          <button
            onClick={() => onLike(photo.id)}
            style={{
              width: '100%', marginBottom: 10,
              background: liked ? '#FFF0F8' : 'linear-gradient(135deg, #E91E8C, #C44DFF)',
              color: liked ? '#E91E8C' : '#fff',
              border: liked ? '1.5px solid #F0AADD' : 'none',
              borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer'
            }}
            data-testid="lightbox-like-btn"
          >
            {liked ? '♥ Loved' : 'Love this ♥'}
          </button>

          {/* Share button */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `${photo.petName}'s celebration`, url: window.location.href });
              } else {
                navigator.clipboard?.writeText(window.location.href);
              }
            }}
            style={{
              width: '100%', background: 'rgba(0,0,0,0.04)',
              color: '#444', border: '1px solid rgba(0,0,0,0.10)',
              borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
            data-testid="lightbox-share-btn"
          >
            Share this moment
          </button>
        </div>
      </div>

      {/* Next arrow */}
      {hasNext && (
        <button onClick={e => { e.stopPropagation(); onNext(); }} style={{
          position: 'absolute', right: 16,
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
          color: '#fff', fontSize: 22, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} data-testid="lightbox-next">›</button>
      )}
    </div>
  );
};

export default WallLightbox;
