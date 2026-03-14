/**
 * MiraBirthdayBox.jsx
 * Mira's curated birthday box card — the opening statement before pet parent makes any choice.
 * 
 * Displays on /celebrate below category strip, above soul pillars.
 * Shows 4 visible slots + "+2 more" chip.
 * Clicking "Build {petName}'s Box" triggers reveal animation then opens builder.
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Gift, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

/* ══════════════════════════════════════════════════════════════════════════════
   HELPER: Build Description Line
   Composes the copy from slot items + picks correct last line based on health/age
   ══════════════════════════════════════════════════════════════════════════════ */
const buildDescriptionLine = (slots, petName, healthCondition, petAge, hasAllergy, soulPercent) => {
  // Zero data state — different structure
  if (soulPercent < 20) {
    return `Mira has built a birthday celebration for ${petName} — ${slots[0]?.chipLabel || 'a birthday cake'}, ${slots[1]?.description || 'a special gift'}, ${slots[2]?.chipLabel || 'a bandana'}, and ${slots[3]?.chipLabel || 'a memory card'}. Everything a dog loves on their birthday. Personalise it for yours.`;
  }

  // Build the main sentence
  const slot1 = slots[0]?.chipLabel || 'a birthday cake';
  const slot2 = slots[1]?.description || 'a special gift';
  const slot3 = slots[2]?.chipLabel || 'a custom bandana';
  const slot4 = slots[3]?.chipLabel || 'a memory card';

  const mainSentence = `Mira has built one celebration that covers who ${petName} actually is — ${slot1}, ${slot2}, ${slot3}, and ${slot4}.`;

  // Pick the last line based on conditions
  let lastLine = `Everything ${petName} loves. Nothing they can't have.`;

  if (healthCondition && petAge > 7) {
    lastLine = `Everything ${petName} loves. Everything gentle, everything safe.`;
  } else if (healthCondition) {
    lastLine = `Everything ${petName} loves. Everything safe for their treatment.`;
  } else if (petAge > 7) {
    lastLine = `Everything ${petName} loves. Everything kind to their body.`;
  } else if (petAge < 1) {
    lastLine = `Everything ${petName} loves. Everything right for where they're growing.`;
  } else if (hasAllergy) {
    // Allergy present but no health condition — still safe
    lastLine = `Everything ${petName} loves. Nothing they can't have.`;
  }

  return `${mainSentence} ${lastLine}`;
};

/* ══════════════════════════════════════════════════════════════════════════════
   HELPER: Get Eyebrow Text
   ══════════════════════════════════════════════════════════════════════════════ */
const getEyebrowText = (petName, birthday, gotchaDay) => {
  const now = new Date();
  
  // Check if gotcha day is within 7 days
  if (gotchaDay) {
    const gotcha = new Date(gotchaDay);
    const daysToGotcha = Math.ceil((gotcha - now) / (1000 * 60 * 60 * 24));
    if (daysToGotcha >= 0 && daysToGotcha <= 7) {
      return `✦ Mira's pick for ${petName}'s gotcha day`;
    }
  }

  // Check if birthday exists
  if (birthday) {
    return `✦ Mira's pick for ${petName}'s birthday`;
  }

  // No birthday registered
  return `✦ Curated by Mira for ${petName}`;
};

/* ══════════════════════════════════════════════════════════════════════════════
   HELPER: Check Urgency
   ══════════════════════════════════════════════════════════════════════════════ */
const getUrgencyInfo = (birthday) => {
  if (!birthday) return null;
  
  const now = new Date();
  const bday = new Date(birthday);
  
  // Set birthday to this year or next
  bday.setFullYear(now.getFullYear());
  if (bday < now) {
    bday.setFullYear(now.getFullYear() + 1);
  }
  
  const daysUntil = Math.ceil((bday - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntil <= 7 && daysUntil >= 0) {
    const orderByDate = new Date(now);
    orderByDate.setDate(orderByDate.getDate() + Math.max(0, daysUntil - 3));
    return {
      daysUntil,
      orderBy: orderByDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    };
  }
  
  return null;
};

/* ══════════════════════════════════════════════════════════════════════════════
   SLOT CHIP COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
const SlotChip = ({ emoji, label, isRevealing = false, delay = 0 }) => {
  if (isRevealing) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 30, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.5, delay, ease: 'easeOut' }}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full"
        style={{
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.18)',
          padding: '6px 14px',
          color: '#FFFFFF',
          fontSize: '13px',
          boxShadow: '0 0 20px rgba(196,77,255,0.4)'
        }}
      >
        <span>{emoji}</span>
        <span>{label}</span>
      </motion.div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full"
      style={{
        background: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.18)',
        padding: '6px 14px',
        color: '#FFFFFF',
        fontSize: '13px'
      }}
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
const MiraBirthdayBox = ({ pet, onBuildBox, onBrowseProducts }) => {
  const [boxPreview, setBoxPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedSlots, setRevealedSlots] = useState([]);
  const [error, setError] = useState(null);

  const petName = pet?.name || 'your pet';
  const petId = pet?.id;

  // Fetch box preview from backend
  useEffect(() => {
    if (!petId) {
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/birthday-box/${petId}/preview`);
        if (!response.ok) throw new Error('Failed to load box preview');
        const data = await response.json();
        setBoxPreview(data);
      } catch (err) {
        console.error('Birthday box preview error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [petId]);

  // Handle "Build Box" click — trigger reveal animation
  const handleBuildClick = () => {
    if (!boxPreview) return;

    // Start reveal animation
    setIsRevealing(true);

    // Reveal slot 5 after 0.3s
    setTimeout(() => {
      setRevealedSlots(prev => [...prev, boxPreview.hiddenSlots?.[0]]);
    }, 300);

    // Reveal slot 6 after 0.9s
    setTimeout(() => {
      setRevealedSlots(prev => [...prev, boxPreview.hiddenSlots?.[1]]);
    }, 900);

    // Open builder after 1.5s total
    setTimeout(() => {
      setIsRevealing(false);
      onBuildBox?.(boxPreview);
    }, 1500);
  };

  // Get dynamic content
  const eyebrowText = getEyebrowText(petName, pet?.birthday, pet?.gotcha_day);
  const urgency = getUrgencyInfo(pet?.birthday);
  const isGotchaDay = eyebrowText.includes('gotcha day');
  const titleText = isGotchaDay ? 'Gotcha Day Box' : 'Birthday Box';

  // Build description from slots
  const description = boxPreview ? buildDescriptionLine(
    boxPreview.visibleSlots || [],
    petName,
    pet?.health_condition,
    pet?.age || 0,
    pet?.allergies?.length > 0,
    boxPreview.soulPercent || 0
  ) : `Mira is preparing a special celebration for ${petName}...`;

  // Loading state
  if (loading) {
    return (
      <div
        className="rounded-[20px] p-7 mb-8 animate-pulse"
        style={{
          background: 'linear-gradient(135deg, #1A0030 0%, #3D0060 50%, #6B0099 100%)',
          border: '1px solid rgba(196,77,255,0.30)',
          minHeight: '200px'
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-48 bg-white/10 rounded-full" />
        </div>
        <div className="h-8 w-64 bg-white/10 rounded mb-3" />
        <div className="h-16 w-full bg-white/10 rounded" />
      </div>
    );
  }

  // Error state — still show a basic box
  if (error || !boxPreview) {
    return (
      <div
        className="rounded-[20px] p-7 mb-8"
        style={{
          background: 'linear-gradient(135deg, #1A0030 0%, #3D0060 50%, #6B0099 100%)',
          border: '1px solid rgba(196,77,255,0.30)',
          boxShadow: '0 8px 32px rgba(196,77,255,0.15)'
        }}
      >
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <div
              className="inline-flex items-center gap-1.5 rounded-full mb-3.5"
              style={{
                background: 'rgba(196,77,255,0.20)',
                border: '1px solid rgba(196,77,255,0.40)',
                padding: '4px 14px',
                color: '#E0AAFF',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <span style={{ color: '#C9973A' }}>✦</span>
              <span>Curated by Mira for {petName}</span>
            </div>

            <h2 className="mb-2.5" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              <span style={{ color: '#FFFFFF' }}>The </span>
              <span style={{ color: '#FF9FE5' }}>{petName}</span>
              <span style={{ color: '#FFFFFF' }}> Birthday Box</span>
            </h2>

            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.70)', lineHeight: 1.65, marginBottom: '18px', maxWidth: '520px' }}>
              Tell Mira more about {petName} and she'll build the perfect birthday celebration.
            </p>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => onBrowseProducts?.()}
                className="inline-flex items-center gap-2 rounded-xl transition-all hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #FF2D87, #C44DFF)',
                  color: '#FFFFFF',
                  padding: '12px 22px',
                  fontSize: '15px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Gift className="w-4 h-4" />
                Browse Birthday Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const visibleSlots = boxPreview.visibleSlots || [];

  return (
    <div data-testid="mira-birthday-box">
      {/* Urgency Banner */}
      {urgency && (
        <div
          className="rounded-t-[20px] px-4 py-2 text-center text-sm font-semibold"
          style={{
            background: 'linear-gradient(90deg, #FF2D87, #C44DFF)',
            color: 'white',
            marginBottom: '-8px'
          }}
        >
          {petName}'s birthday is in {urgency.daysUntil} days! Order by {urgency.orderBy} for delivery in time.
        </div>
      )}

      {/* Main Card */}
      <div
        className="rounded-[20px] p-7 mb-8"
        style={{
          background: 'linear-gradient(135deg, #1A0030 0%, #3D0060 50%, #6B0099 100%)',
          border: '1px solid rgba(196,77,255,0.30)',
          boxShadow: '0 8px 32px rgba(196,77,255,0.15)',
          borderTopLeftRadius: urgency ? '0' : '20px',
          borderTopRightRadius: urgency ? '0' : '20px'
        }}
      >
        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* Left Column — Content */}
          <div className="flex-1 min-w-0">
            {/* Eyebrow Chip */}
            <div
              className="inline-flex items-center gap-1.5 rounded-full mb-3.5"
              style={{
                background: 'rgba(196,77,255,0.20)',
                border: '1px solid rgba(196,77,255,0.40)',
                padding: '4px 14px',
                color: '#E0AAFF',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <span style={{ color: '#C9973A' }}>✦</span>
              <span>{eyebrowText.replace('✦ ', '')}</span>
            </div>

            {/* Title */}
            <h2 className="mb-2.5" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
              <span style={{ color: '#FFFFFF' }}>The </span>
              <span style={{ color: '#FF9FE5' }}>{petName}</span>
              <span style={{ color: '#FFFFFF' }}> {titleText}</span>
            </h2>

            {/* Description */}
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.70)',
              lineHeight: 1.65,
              marginBottom: '18px',
              maxWidth: '520px'
            }}>
              {description}
            </p>

            {/* Item Chips */}
            <div className="flex flex-wrap gap-2 mb-5">
              {visibleSlots.map((slot, idx) => (
                <SlotChip
                  key={idx}
                  emoji={slot.emoji}
                  label={slot.chipLabel}
                />
              ))}

              {/* Revealed Slots (animated) */}
              <AnimatePresence>
                {revealedSlots.map((slot, idx) => slot && (
                  <SlotChip
                    key={`revealed-${idx}`}
                    emoji={slot.emoji}
                    label={slot.chipLabel}
                    isRevealing={true}
                    delay={idx * 0.3}
                  />
                ))}
              </AnimatePresence>

              {/* +2 More Chip (hidden when revealing) */}
              {!isRevealing && revealedSlots.length === 0 && (
                <div
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full"
                  style={{
                    background: 'rgba(196,77,255,0.20)',
                    border: '1px solid rgba(196,77,255,0.40)',
                    padding: '6px 14px',
                    color: '#E0AAFF',
                    fontSize: '13px'
                  }}
                >
                  +2 more
                </div>
              )}
            </div>

            {/* Button Row */}
            <div className="flex gap-3 flex-wrap">
              {/* Primary CTA */}
              <button
                onClick={handleBuildClick}
                disabled={isRevealing}
                className="inline-flex items-center gap-2 rounded-xl transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #FF2D87, #C44DFF)',
                  color: '#FFFFFF',
                  padding: '12px 22px',
                  fontSize: '15px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: isRevealing ? 'wait' : 'pointer',
                  boxShadow: isRevealing ? '0 0 30px rgba(196,77,255,0.6)' : 'none'
                }}
                data-testid="build-box-btn"
              >
                {isRevealing ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Revealing...
                  </>
                ) : (
                  <>
                    <span>🎉</span>
                    Build {petName}'s Box
                  </>
                )}
              </button>

              {/* Secondary CTA */}
              <button
                onClick={() => onBrowseProducts?.()}
                className="inline-flex items-center gap-2 rounded-xl transition-all hover:bg-white/[0.18]"
                style={{
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#FFFFFF',
                  padding: '12px 22px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                data-testid="browse-birthday-btn"
              >
                Birthday Box
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Add Birthday Prompt (if no birthday) */}
            {!pet?.birthday && (
              <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.50)' }}>
                🎂 Add {petName}'s birthday and Mira will personalise this box for the exact day
              </p>
            )}

            {/* Low Soul Banner */}
            {boxPreview.soulPercent < 30 && (
              <div
                className="mt-4 px-4 py-2 rounded-lg text-sm"
                style={{
                  background: 'rgba(196,77,255,0.15)',
                  border: '1px solid rgba(196,77,255,0.30)',
                  color: '#E0AAFF'
                }}
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-2" />
                Tell Mira more about {petName} and she'll make this box perfect.
              </div>
            )}
          </div>

          {/* Right Column — Mira Icon */}
          <div className="flex-shrink-0 text-center hidden md:block">
            <div
              className="flex items-center justify-center mb-2 ml-auto"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FF2D87, #C44DFF)',
                fontSize: '36px'
              }}
            >
              🎁
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap' }}>
              Curated by Mira
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiraBirthdayBox;
