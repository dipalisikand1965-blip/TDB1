/**
 * BirthdayBoxBuilder.jsx
 * Multi-step Birthday Box builder modal — Concierge fulfilment flow.
 *
 * Listens for custom event: openOccasionBoxBuilder
 * Detail: { preset, petName, petId, userEmail, userName }
 *
 * Steps:
 *  1. Review all 6 revealed slots
 *  2. Health / Allergy confirmation (only if pet has allergies)
 *  3. Concierge Handoff screen — NOT an order confirmation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Check, AlertTriangle, Sparkles, Gift, ChevronRight,
  Loader2, ShieldCheck, Phone, Clock, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useResizeMobile } from '../../hooks/useResizeMobile';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

/* ─────────────────────────────────────────────────────────────────
   SLOT ROW — compact, mobile-friendly
   ───────────────────────────────────────────────────────────────── */
const SlotRow = ({ slot, index }) => {
  const slotLabels = ['HERO', 'JOY', 'STYLE', 'MEMORY', 'HEALTH', 'SURPRISE'];
  const label = slotLabels[index] || `SLOT ${index + 1}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.06 }}
      className="flex items-center gap-3 rounded-xl p-3"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base"
        style={{ background: 'rgba(196,77,255,0.18)' }}
      >
        {slot.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold tracking-wide" style={{ color: 'rgba(196,77,255,0.75)', fontSize: '10px' }}>
          {label}
        </p>
        <p className="text-sm font-semibold text-white leading-tight truncate">
          {slot.itemName || slot.chipLabel}
        </p>
        {slot.description && (
          <p className="text-xs leading-tight" style={{ color: 'rgba(255,255,255,0.50)' }}>{slot.description}</p>
        )}
      </div>

      {slot.isAllergySafe && (
        <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(34,197,94,0.18)', color: '#86efac', fontSize: '10px' }}>
          Safe
        </span>
      )}
      {slot.hiddenUntilDelivery && (
        <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(196,77,255,0.18)', color: '#E0AAFF', fontSize: '10px' }}>
          Surprise
        </span>
      )}
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   STEP 1 — BOX REVIEW
   ───────────────────────────────────────────────────────────────── */
const StepReview = ({ boxData, petName, onNext, onOpenBrowse }) => {
  const allSlots = [
    ...(boxData?.visibleSlots || []),
    ...(boxData?.hiddenSlots || []),
  ];

  return (
    <div>
      {/* Mira header */}
      <div className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4"
        style={{ background: 'rgba(196,77,255,0.12)', border: '1px solid rgba(196,77,255,0.25)' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF2D87, #C44DFF)' }}>
          ✦
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Mira built this for <strong style={{ color: '#FF9FE5' }}>{petName}</strong> based on their soul profile.
        </p>
      </div>

      {/* Allergy notice */}
      {boxData?.hasAllergies && (
        <div className="flex items-start gap-2 rounded-xl px-4 py-3 mb-4"
          style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#86efac' }} />
          <p className="text-xs" style={{ color: '#86efac' }}>
            All items filtered for {petName}'s allergies: no{' '}
            <strong>{boxData.allergies?.join(', ')}</strong>
          </p>
        </div>
      )}

      {/* Slot rows */}
      <div className="space-y-2 mb-5">
        {allSlots.map((slot, i) => (
          <SlotRow key={i} slot={slot} index={i} />
        ))}
      </div>

      {/* Browse link */}
      <p className="text-xs text-center mb-4 cursor-pointer hover:underline"
        style={{ color: 'rgba(196,77,255,0.80)' }} onClick={onOpenBrowse}>
        Want to swap something? Browse all options →
      </p>

      <button onClick={onNext}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #FF2D87, #C44DFF)', fontSize: '15px', boxShadow: '0 4px 20px rgba(196,77,255,0.35)' }}
        data-testid="builder-next-btn">
        <Gift className="w-5 h-5" />
        {boxData?.hasAllergies ? 'Review Health & Safety' : `Send to Concierge`}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   STEP 2 — ALLERGY CONFIRMATION
   ───────────────────────────────────────────────────────────────── */
const StepAllergyCheck = ({ boxData, petName, onBack, onConfirm, isOrdering }) => {
  const [confirmed, setConfirmed] = useState(false);
  const healthSlot = [...(boxData?.visibleSlots || []), ...(boxData?.hiddenSlots || [])].find(s => s.slotNumber === 5);

  return (
    <div>
      <div className="flex items-start gap-3 rounded-xl px-4 py-3 mb-4"
        style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.30)' }}>
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
        <div>
          <p className="text-sm font-semibold text-white mb-0.5">{petName}'s Allergy Profile</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>
            Known allergies:{' '}
            <strong style={{ color: '#fbbf24' }}>{boxData?.allergies?.join(', ') || 'see profile'}</strong>
          </p>
        </div>
      </div>

      {healthSlot && (
        <div className="rounded-xl p-4 mb-4"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <p className="text-xs uppercase font-bold tracking-wide mb-2" style={{ color: 'rgba(196,77,255,0.80)', fontSize: '10px' }}>
            Slot 5 — Health Item
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{healthSlot.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{healthSlot.itemName || healthSlot.chipLabel}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{healthSlot.description}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(34,197,94,0.18)', color: '#86efac' }}>
              Allergy-safe
            </span>
          </div>
        </div>
      )}

      <div className="rounded-xl px-4 py-3 mb-4"
        style={{ background: 'rgba(196,77,255,0.10)', border: '1px solid rgba(196,77,255,0.22)' }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.80)' }}>
          Every item in {petName}'s box has been checked against their allergy profile. Please confirm you've reviewed this before sending to Concierge.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer mb-5">
        <div onClick={() => setConfirmed(c => !c)}
          className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5 transition-all"
          style={{
            background: confirmed ? 'linear-gradient(135deg, #FF2D87, #C44DFF)' : 'rgba(255,255,255,0.10)',
            border: confirmed ? 'none' : '1.5px solid rgba(255,255,255,0.30)',
          }}
          data-testid="allergy-confirm-checkbox">
          {confirmed && <Check className="w-3 h-3 text-white" />}
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.80)' }}>
          I confirm I've reviewed the box and it is safe for{' '}
          <strong style={{ color: '#FF9FE5' }}>{petName}</strong>'s allergies
        </p>
      </label>

      <div className="flex gap-3">
        <button onClick={onBack}
          className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.80)' }}
          data-testid="builder-back-btn">
          ← Back
        </button>
        <button
          onClick={() => confirmed && onConfirm(true)}
          disabled={!confirmed || isOrdering}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all"
          style={{
            background: confirmed ? 'linear-gradient(135deg, #FF2D87, #C44DFF)' : 'rgba(255,255,255,0.12)',
            color: confirmed ? '#fff' : 'rgba(255,255,255,0.40)',
            cursor: confirmed ? 'pointer' : 'not-allowed',
            fontSize: '14px',
          }}
          data-testid="builder-confirm-order-btn">
          {isOrdering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isOrdering ? 'Sending...' : 'Confirm & Send to Concierge'}
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   SLOT SUMMARY ROW (compact — for Step 3 left column)
   ───────────────────────────────────────────────────────────────── */
const SlotSummaryRow = ({ slot, index }) => {
  const slotLabels = ['Hero', 'Joy', 'Style', 'Memory', 'Health', 'Surprise'];
  return (
    <div className="flex items-center gap-2.5 py-2"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="text-base w-6 text-center flex-shrink-0">{slot.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold" style={{ color: 'rgba(196,77,255,0.70)', fontSize: '10px' }}>
          {slotLabels[index] || `Slot ${index+1}`}
        </p>
        <p className="text-xs font-semibold text-white truncate leading-tight">
          {slot.itemName || slot.chipLabel}
        </p>
      </div>
      {slot.isAllergySafe && (
        <span style={{ color: '#86efac', fontSize: '10px' }}>✓ Safe</span>
      )}
      {slot.hiddenUntilDelivery && (
        <span style={{ color: '#E0AAFF', fontSize: '10px' }}>🎁</span>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   STEP 3 — CONCIERGE HANDOFF
   ───────────────────────────────────────────────────────────────── */
const StepConciergeHandoff = ({ petName, ticketId, boxData, onClose }) => {
  const allSlots = [
    ...(boxData?.visibleSlots || []),
    ...(boxData?.hiddenSlots || []),
  ];

  // Also fire toast (works when browser renders it above modal)
  useEffect(() => {
    toast.success(`Sent to Concierge!`, {
      duration: 8000,
      description: `${petName}'s Birthday Box confirmed — your Concierge will be in touch within 24 hours.`,
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* ── In-modal confirmation banner (always visible) ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
        style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(21,128,61,0.12))',
          border: '1.5px solid rgba(34,197,94,0.45)',
          boxShadow: '0 0 20px rgba(34,197,94,0.15)',
        }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(34,197,94,0.25)' }}>
          <Check className="w-4 h-4" style={{ color: '#86efac' }} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: '#86efac' }}>Sent to Concierge</p>
          <p className="text-xs" style={{ color: 'rgba(134,239,172,0.75)' }}>
            We'll be in touch within 24 hours
          </p>
        </div>
        {ticketId && (
          <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.18)', color: '#86efac' }}>
            {ticketId}
          </span>
        )}
      </motion.div>

      {/* Hero */}
      <div className="text-center mb-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mx-auto mb-3"
          style={{ background: 'linear-gradient(135deg, #FF2D87, #C44DFF)' }}>
          🎉
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          {petName}'s Birthday Box is confirmed.
        </h3>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Your Concierge has everything they need to build it.
        </p>
      </div>

      {/* Two-column: slots + what happens next */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">

        {/* Left — confirmed slots */}
        <div className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-3"
            style={{ color: 'rgba(196,77,255,0.80)', fontSize: '10px' }}>
            6 Slots Confirmed
          </p>
          {allSlots.map((slot, i) => (
            <SlotSummaryRow key={i} slot={slot} index={i} />
          ))}
        </div>

        {/* Right — what happens next */}
        <div className="rounded-xl p-4"
          style={{ background: 'rgba(196,77,255,0.10)', border: '1px solid rgba(196,77,255,0.22)' }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-3"
            style={{ color: '#E0AAFF', fontSize: '10px' }}>
            What happens next
          </p>
          <div className="space-y-3">
            {[
              { icon: <Clock className="w-3.5 h-3.5" />, text: `Your Concierge will contact you within 24 hours` },
              { icon: <Star className="w-3.5 h-3.5" />, text: `Confirm ${petName}'s name on the bandana` },
              { icon: <Gift className="w-3.5 h-3.5" />, text: `Confirm the cake message` },
              { icon: <Phone className="w-3.5 h-3.5" />, text: `Delivery address and date` },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5" style={{ color: '#C44DFF' }}>{item.icon}</span>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(196,77,255,0.20)' }}>
            <p className="text-xs italic" style={{ color: 'rgba(255,255,255,0.50)' }}>
              This is not an e-commerce order. Assembled, personalised, and delivered as a single concierge service.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #FF2D87, #C44DFF)', fontSize: '15px' }}
        data-testid="builder-done-btn"
      >
        Done
      </button>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────── */
const BirthdayBoxBuilder = ({ onOpenBrowseDrawer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [boxData, setBoxData] = useState(null);
  const [petName, setPetName] = useState('');
  const [petId, setPetId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [step, setStep] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [ticketId, setTicketId] = useState(null);

  // ResizeObserver on the modal backdrop container — 150ms debounce
  const [containerRef, isMobile] = useResizeMobile(640);

  // Listen for open event
  useEffect(() => {
    const handleOpen = (e) => {
      const { preset, petName: name, petId: id, userEmail: email, userName: uname } = e.detail || {};
      setBoxData(preset);
      setPetName(name || preset?.petName || 'your pet');
      // Fallback to preset.petId if direct petId not passed (robustness)
      setPetId(id || preset?.petId || null);
      setUserEmail(email || '');
      setUserName(uname || '');
      setStep(1);
      setIsOpen(true);
      setTicketId(null);
    };
    window.addEventListener('openOccasionBoxBuilder', handleOpen);
    return () => window.removeEventListener('openOccasionBoxBuilder', handleOpen);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setStep(1);
    setTicketId(null);
  }, []);

  // handleSendToConcierge defined before handleNext to prevent stale closure
  const handleSendToConcierge = useCallback(async (allergyConfirmed) => {
    // petId fallback: try state, then boxData.petId, then boxData.petId field
    const resolvedPetId = petId || boxData?.petId;
    if (!resolvedPetId || !boxData) {
      toast.error('Missing pet data. Please close and try again.');
      console.error('[BirthdayBoxBuilder] petId or boxData missing', { petId, boxData });
      return;
    }

    setIsOrdering(true);
    try {
      const allSlots = [...(boxData.visibleSlots || []), ...(boxData.hiddenSlots || [])];
      const response = await fetch(`${API_BASE}/api/birthday-box/${resolvedPetId}/concierge-handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: allSlots,
          allergyConfirmed: allergyConfirmed || !boxData.hasAllergies,
          userEmail,
          userName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTicketId(data.ticketId);
        setStep(3);
        // Toast fires in StepConciergeHandoff useEffect (above modal overlay)
      } else if (data.error === 'allergy_confirmation_required') {
        setStep(2);
        toast.warning('Please confirm allergy safety first.');
      } else {
        toast.error(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('[BirthdayBoxBuilder] Concierge handoff error:', err);
      toast.error('Failed to send to Concierge. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  }, [petId, boxData, petName, userEmail, userName]);

  const handleNext = useCallback(() => {
    if (boxData?.hasAllergies) {
      setStep(2);
    } else {
      handleSendToConcierge(false);
    }
  }, [boxData, handleSendToConcierge]);

  const stepCount = boxData?.hasAllergies ? 2 : 1;
  const stepLabel = step < 3 ? `Step ${step} of ${stepCount}` : '';

  const stepTitle = {
    1: `The ${petName} Birthday Box`,
    2: 'Health & Allergy Check',
    3: 'Sent to Concierge',
  }[step] || '';

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {/* Backdrop — containerRef here so ResizeObserver tracks full viewport */}
      <motion.div
        key="backdrop"
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={step !== 3 ? handleClose : undefined}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9200,
          background: 'rgba(10,0,26,0.80)',
          backdropFilter: 'blur(4px)',
        }}
        data-testid="builder-backdrop"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        data-testid="birthday-box-builder"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9201,
          display: 'flex',
          // Mobile: pin to top so X button clears the sticky header
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'center',
          padding: isMobile ? '110px 12px 80px' : '16px',
          pointerEvents: 'none',
          overflowY: isMobile ? 'auto' : 'visible',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '512px',
            borderRadius: '16px',
            overflowX: 'hidden',
            overflowY: 'auto',
            background: 'linear-gradient(145deg, #140028 0%, #2D0060 60%, #1A0030 100%)',
            border: '1px solid rgba(196,77,255,0.30)',
            boxShadow: '0 8px 64px rgba(196,77,255,0.30)',
            maxHeight: isMobile ? 'none' : '88vh',
            pointerEvents: 'all',
          }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
            style={{ background: 'rgba(20,0,40,0.96)', borderBottom: '1px solid rgba(196,77,255,0.18)' }}
          >
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#C44DFF' }} />
                {stepTitle}
              </h2>
              {stepLabel && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(196,77,255,0.70)' }}>
                  {stepLabel}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ color: 'rgba(255,255,255,0.60)' }}
              data-testid="builder-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <StepReview
                    boxData={boxData}
                    petName={petName}
                    onNext={handleNext}
                    onOpenBrowse={() => {
                      handleClose();
                      onOpenBrowseDrawer?.();
                    }}
                  />
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <StepAllergyCheck
                    boxData={boxData}
                    petName={petName}
                    onBack={() => setStep(1)}
                    onConfirm={handleSendToConcierge}
                    isOrdering={isOrdering}
                  />
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <StepConciergeHandoff
                    petName={petName}
                    ticketId={ticketId}
                    boxData={boxData}
                    onClose={handleClose}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
};

export default BirthdayBoxBuilder;
