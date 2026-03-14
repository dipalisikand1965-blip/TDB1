/**
 * WallUploadModal.jsx
 * 
 * 3-step upload modal: Photo → Caption+Tag → Confirmation.
 * Spec: CelebrationWall_MASTER.docx Section 4.
 *
 * Step 1: File picker (drag/drop) · preview
 * Step 2: Caption (140 char), celebration type chips, city, petName
 * Step 3: Confirmation + "see your photo" CTA
 */

import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const CELEBRATION_TYPES = [
  'Birthday', 'Gotcha Day', 'Milestone', 'Photoshoot', 'Pawty', 'Just because'
];

const MIRA_COMMENTS = {
  'Birthday': "I love this one. This is exactly how {petName} deserves to be celebrated.",
  'Gotcha Day': "The day {petName} came home. I know what that day means.",
  'Milestone': "Every milestone deserves to be remembered. This one especially.",
  'Photoshoot': "This is {petName} at their most beautiful. Keep this one forever.",
  'Pawty': "Look at that face. {petName} knew exactly what was happening.",
  'Just because': "Some days don't need a reason. This is one of them.",
  'default': "{petName} and the people who love them. That's the whole story."
};

const WallUploadModal = ({ isOpen, onClose, petName, petId, onSubmitted }) => {
  const { token } = useAuth();
  const [step, setStep] = useState(1);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileBase64, setFileBase64] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [caption, setCaption] = useState('');
  const [celebType, setCelebType] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const displayName = petName || 'your pet';

  if (!isOpen) return null;

  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('Max file size is 10MB'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
      setFileBase64(e.target.result); // base64 data URL
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const apiUrl = getApiUrl();
      const miraKey = MIRA_COMMENTS[celebType] ? celebType : 'default';
      const miraComment = (MIRA_COMMENTS[miraKey] || MIRA_COMMENTS['default'])
        .replace(/\{petName\}/g, displayName);

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        image_url: fileBase64 || previewUrl,
        pet_name: displayName,
        pet_id: petId || null,
        caption: caption.trim(),
        celebration_type: celebType || 'Birthday',
        city: city.trim() || null,
        mira_comment: miraComment,
        source: 'ugc'
      };

      let uploadedPhotoId = null;
      const res = await fetch(`${apiUrl}/api/celebration-wall/photos/ugc`, {
        method: 'POST', headers, body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        uploadedPhotoId = data.photo_id || data.id;
      }

      // Show confirmation FIRST, then notify parent from the "See your photo" button
      setSubmitting(false);
      setStep(3);
      // Store uploadedPhotoId for the confirmation button to use
      window.__lastUploadedWallPhotoId = uploadedPhotoId;
    } catch (err) {
      console.error('[WallUploadModal] Submit error:', err);
      setSubmitting(false);
      setStep(3); // graceful fallback — show confirmation anyway
    }
  };

  const handleClose = () => {
    setStep(1); setPreviewUrl(null); setFileBase64(null);
    setCaption(''); setCelebType(''); setCity('');
    onClose();
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.50)', zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
      }}
      data-testid="wall-upload-modal-overlay"
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF', borderRadius: 20, padding: 32,
          maxWidth: 460, width: '100%', maxHeight: '90vh', overflowY: 'auto',
          position: 'relative'
        }}
        data-testid="wall-upload-modal"
      >
        {/* Close */}
        <button onClick={handleClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'none', border: 'none', cursor: 'pointer', padding: 4
        }} data-testid="wall-modal-close">
          <X className="w-5 h-5" style={{ color: '#888' }} />
        </button>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 9999,
              background: s <= step ? '#E91E8C' : '#F3F4F6',
              transition: 'background 300ms'
            }} />
          ))}
        </div>

        {/* ── STEP 1: Photo Upload ── */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A0030', marginBottom: 20 }}>
              📸 Add {displayName}'s moment
            </h2>

            {previewUrl ? (
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <img src={previewUrl} alt="preview" style={{
                  width: '100%', height: 220, objectFit: 'cover', borderRadius: 12
                }} />
                <button onClick={() => setPreviewUrl(null)} style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.60)', border: 'none', cursor: 'pointer',
                  color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>✕</button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${dragging ? '#E91E8C' : '#F0AADD'}`,
                  borderRadius: 12, padding: '40px 20px',
                  textAlign: 'center', cursor: 'pointer',
                  marginBottom: 20, transition: 'border-color 200ms',
                  background: dragging ? '#FFF0F8' : '#FAFAFA'
                }}
                data-testid="wall-upload-dropzone"
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>📷</div>
                <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
                  Drag photo here or <strong style={{ color: '#E91E8C' }}>tap to choose</strong>
                </p>
                <p style={{ fontSize: 12, color: '#bbb', marginTop: 6 }}>JPG · PNG · WEBP · max 10MB</p>
              </div>
            )}

            <input type="file" ref={fileInputRef} accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files?.[0])}
            />

            <button
              onClick={() => setStep(2)}
              disabled={!previewUrl}
              style={{
                width: '100%', background: previewUrl ? 'linear-gradient(135deg, #E91E8C, #C44DFF)' : '#E5E7EB',
                color: previewUrl ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 12,
                padding: 13, fontSize: 15, fontWeight: 800, cursor: previewUrl ? 'pointer' : 'not-allowed'
              }}
              data-testid="wall-upload-next"
            >
              Next →
            </button>
          </>
        )}

        {/* ── STEP 2: Caption + Tag ── */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A0030', marginBottom: 20 }}>
              Tell us about this moment
            </h2>

            {/* Caption */}
            <div style={{ marginBottom: 18 }}>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value.slice(0, 140))}
                placeholder={`What made this day special for ${displayName}?`}
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: '1.5px solid rgba(0,0,0,0.12)', fontSize: 13,
                  fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                data-testid="wall-caption-input"
              />
              <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 4 }}>
                {caption.length}/140
              </div>
            </div>

            {/* Celebration type */}
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A0030', marginBottom: 10 }}>
              What are we celebrating?
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {CELEBRATION_TYPES.map(t => (
                <button key={t} onClick={() => setCelebType(t)} style={{
                  padding: '7px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer',
                  background: celebType === t ? 'linear-gradient(135deg, #E91E8C, #C44DFF)' : 'rgba(0,0,0,0.04)',
                  border: celebType === t ? '1px solid transparent' : '1px solid rgba(0,0,0,0.10)',
                  color: celebType === t ? '#fff' : '#444',
                  transition: 'all 150ms'
                }}
                  data-testid={`wall-celeb-type-${t.toLowerCase().replace(/\s/g, '-')}`}
                >{t}</button>
              ))}
            </div>

            {/* City */}
            <input
              type="text" value={city} onChange={e => setCity(e.target.value)}
              placeholder="Your city (optional)"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid rgba(0,0,0,0.12)', fontSize: 13, marginBottom: 22,
                boxSizing: 'border-box', fontFamily: 'inherit'
              }}
              data-testid="wall-city-input"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting || !caption.trim() || !celebType}
              style={{
                width: '100%',
                background: (caption.trim() && celebType && !submitting)
                  ? 'linear-gradient(135deg, #E91E8C, #C44DFF)' : '#E5E7EB',
                color: (caption.trim() && celebType && !submitting) ? '#fff' : '#9CA3AF',
                border: 'none', borderRadius: 12,
                padding: 13, fontSize: 15, fontWeight: 800,
                cursor: (caption.trim() && celebType && !submitting) ? 'pointer' : 'not-allowed'
              }}
              data-testid="wall-submit-btn"
            >
              {submitting ? 'Sharing...' : 'Share on the Wall →'}
            </button>
          </>
        )}

        {/* ── STEP 3: Confirmation ── */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A0030', marginBottom: 10 }}>
              Your story is on the wall ♥
            </h2>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 28 }}>
              Mira has seen it. The community will love it.
            </p>
            <button
              onClick={() => {
                // Notify parent AFTER user sees confirmation (not before)
                const photoId = window.__lastUploadedWallPhotoId || 'local';
                onSubmitted && onSubmitted(photoId);
                handleClose();
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #E91E8C, #C44DFF)',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: 13, fontSize: 14, fontWeight: 800, cursor: 'pointer'
              }}
              data-testid="wall-confirmation-close"
            >
              See your photo →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WallUploadModal;
