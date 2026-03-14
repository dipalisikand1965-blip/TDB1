/**
 * BirthdayBoxBuilder.jsx
 * Multi-step Birthday Box builder modal.
 *
 * Opens after the 1.5s reveal animation on MiraBirthdayBox card.
 * Listens to custom event: openOccasionBoxBuilder
 *
 * Steps:
 *  1. Review all 6 revealed slots
 *  2. Health / Allergy confirmation (only if pet has allergies)
 *  3. Order confirmed
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, AlertTriangle, Sparkles, Gift, ChevronRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

/* ─────────────────────────────────────────────────────────────────
   SLOT ROW
   ───────────────────────────────────────────────────────────────── */
const SlotRow = ({ slot, index, onBrowse }) => {
  const slotLabels = ['Hero', 'Joy', 'Style', 'Memory', 'Health', 'Surprise'];
  const label = slotLabels[index] || `Slot ${index + 1}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className="flex items-center gap-3 rounded-xl p-3"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {/* Emoji bubble */}
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
        style={{ background: 'rgba(196,77,255,0.18)' }}
      >
        {slot.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(196,77,255,0.85)' }}>
          {label}
        </p>
        <p className="text-sm font-semibold text-white leading-tight truncate">
          {slot.itemName || slot.chipLabel}
        </p>
        {slot.description && (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{slot.description}</p>
        )}
      </div>

      {/* Allergy safe badge */}
      {slot.isAllergySafe && (
        <span
          className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(34,197,94,0.18)', color: '#86efac' }}
        >
          Safe
        </span>
      )}

      {/* Surprise badge */}
      {slot.hiddenUntilDelivery && (
        <span
          className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(196,77,255,0.18)', color: '#E0AAFF' }}
        >
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
      {/* Mira header strip */}
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5"
        style={{ background: 'rgba(196,77,255,0.12)', border: '1px solid rgba(196,77,255,0.25)' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF2D87, #C44DFF)' }}
        >
          ✦
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Mira built this for <strong style={{ color: '#FF9FE5' }}>{petName}</strong> based on their soul profile.
        </p>
      </div>

      {/* Allergy notice */}
      {boxData?.hasAllergies && (
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 mb-4"
          style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)' }}
        >
          <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#86efac' }} />
          <p className="text-xs" style={{ color: '#86efac' }}>
            All items filtered for {petName}'s allergies: no{' '}
            <strong>{boxData.allergies?.join(', ')}</strong>
          </p>
        </div>
      )}

      {/* Slot rows */}
      <div className="space-y-2 mb-6">
        {allSlots.map((slot, i) => (
          <SlotRow key={i} slot={slot} index={i} onBrowse={onOpenBrowse} />
        ))}
      </div>

      {/* Browse link */}
      <p
        className="text-xs text-center mb-5 cursor-pointer hover:underline"
        style={{ color: 'rgba(196,77,255,0.80)' }}
        onClick={onOpenBrowse}
      >
        Want to swap something? Browse all options →
      </p>

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
        style={{
          background: 'linear-gradient(135deg, #FF2D87, #C44DFF)',
          fontSize: '16px',
          boxShadow: '0 4px 20px rgba(196,77,255,0.35)',
        }}
        data-testid="builder-next-btn"
      >
        <Gift className="w-5 h-5" />
        {boxData?.hasAllergies ? `Review Health & Safety` : `Confirm ${petName}'s Box`}
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

  const healthSlot = [...(boxData?.visibleSlots || []), ...(boxData?.hiddenSlots || [])].find(
    s => s.slotNumber === 5
  );

  return (
    <div>
      {/* Warning header */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5"
        style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.30)' }}
      >
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
        <div>
          <p className="text-sm font-semibold text-white mb-0.5">{petName}'s Allergy Profile</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>
            Known allergies:{' '}
            <strong style={{ color: '#fbbf24' }}>{boxData?.allergies?.join(', ') || 'see profile'}</strong>
          </p>
        </div>
      </div>

      {/* Health slot detail */}
      {healthSlot && (
        <div className="rounded-xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <p className="text-xs uppercase font-bold tracking-wide mb-2" style={{ color: 'rgba(196,77,255,0.80)' }}>
            Slot 5 — Health Item
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{healthSlot.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-white">{healthSlot.itemName || healthSlot.chipLabel}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{healthSlot.description}</p>
            </div>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(34,197,94,0.18)', color: '#86efac' }}
            >
              Allergy-safe
            </span>
          </div>
        </div>
      )}

      {/* Mira's note */}
      <div
        className="rounded-xl px-4 py-3 mb-5"
        style={{ background: 'rgba(196,77,255,0.10)', border: '1px solid rgba(196,77,255,0.22)' }}
      >
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.80)' }}>
          Every item in {petName}'s box has been checked against their allergy profile.
          Nothing harmful has been included. Please confirm you've reviewed this.
        </p>
      </div>

      {/* Checkbox */}
      <label className="flex items-start gap-3 cursor-pointer mb-6">
        <div
          onClick={() => setConfirmed(c => !c)}
          className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center mt-0.5 transition-all"
          style={{
            background: confirmed ? 'linear-gradient(135deg, #FF2D87, #C44DFF)' : 'rgba(255,255,255,0.10)',
            border: confirmed ? 'none' : '1.5px solid rgba(255,255,255,0.30)',
          }}
          data-testid="allergy-confirm-checkbox"
        >
          {confirmed && <Check className="w-3 h-3 text-white" />}
        </div>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.80)' }}>
          I confirm I've reviewed the box and it is safe for{' '}
          <strong style={{ color: '#FF9FE5' }}>{petName}</strong>'s allergies
        </p>
      </label>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.80)' }}
          data-testid="builder-back-btn"
        >
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
            fontSize: '15px',
          }}
          data-testid="builder-confirm-order-btn"
        >
          {isOrdering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Confirm & Build
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   STEP 3 — SUCCESS
   ───────────────────────────────────────────────────────────────── */
const StepSuccess = ({ petName, orderId, onClose }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-6"
  >
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
      style={{ background: 'linear-gradient(135deg, #FF2D87, #C44DFF)' }}
    >
      🎁
    </div>
    <h3 className="text-xl font-bold text-white mb-2">
      {petName}'s Box is Ready!
    </h3>
    <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
      Mira has finalised the box.
    </p>
    {orderId && (
      <p className="text-xs mb-6" style={{ color: 'rgba(196,77,255,0.80)' }}>
        Order ID: <code style={{ color: '#E0AAFF' }}>{orderId}</code>
      </p>
    )}
    <div
      className="rounded-xl px-4 py-3 mb-6 text-sm"
      style={{ background: 'rgba(196,77,255,0.12)', border: '1px solid rgba(196,77,255,0.25)', color: 'rgba(255,255,255,0.80)' }}
    >
      Our concierge team will reach out to confirm delivery details for {petName}'s celebration.
    </div>
    <button
      onClick={onClose}
      className="w-full py-3.5 rounded-xl font-bold text-white"
      style={{ background: 'linear-gradient(135deg, #FF2D87, #C44DFF)', fontSize: '15px' }}
      data-testid="builder-done-btn"
    >
      Done
    </button>
  </motion.div>
);

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────────────────────────── */
const BirthdayBoxBuilder = ({ onOpenBrowseDrawer }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [boxData, setBoxData] = useState(null);
  const [petName, setPetName] = useState('');
  const [petId, setPetId] = useState(null);
  const [step, setStep] = useState(1); // 1: review, 2: allergy check (optional), 3: success
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Listen for the open event from CelebratePageNew
  useEffect(() => {
    const handleOpen = (e) => {
      const { preset, petName: name, petId: id } = e.detail || {};
      setBoxData(preset);
      setPetName(name || 'your pet');
      setPetId(id);
      setStep(1);
      setIsOpen(true);
      setOrderId(null);
    };

    window.addEventListener('openOccasionBoxBuilder', handleOpen);
    return () => window.removeEventListener('openOccasionBoxBuilder', handleOpen);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setStep(1);
    setOrderId(null);
  }, []);

  const handleNext = useCallback(() => {
    if (boxData?.hasAllergies) {
      setStep(2);
    } else {
      // No allergies — go directly to confirm
      handleConfirmOrder(false);
    }
  }, [boxData]);

  const handleConfirmOrder = useCallback(async (allergyConfirmed) => {
    if (!petId || !boxData) {
      toast.error('Missing pet data. Please try again.');
      return;
    }

    setIsOrdering(true);
    try {
      const allSlots = [...(boxData.visibleSlots || []), ...(boxData.hiddenSlots || [])];
      const response = await fetch(`${API_BASE}/api/birthday-box/${petId}/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slots: allSlots,
          allergyConfirmed: allergyConfirmed || !boxData.hasAllergies,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOrderId(data.orderId);
        setStep(3);
        toast.success(`${petName}'s birthday box is ready!`);
      } else if (data.error === 'allergy_confirmation_required') {
        setStep(2);
        toast.warning('Please confirm allergy safety first.');
      } else {
        toast.error(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('[BirthdayBoxBuilder] Order error:', err);
      toast.error('Failed to build box. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  }, [petId, boxData, petName]);

  const stepCount = boxData?.hasAllergies ? 2 : 1;
  const stepLabel = step < 3 ? `Step ${step} of ${stepCount}` : '';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={step !== 3 ? handleClose : undefined}
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(10,0,26,0.80)', backdropFilter: 'blur(4px)' }}
        data-testid="builder-backdrop"
      />

      {/* Modal */}
      <motion.div
        key="modal"
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[201] flex items-center justify-center p-4"
        data-testid="birthday-box-builder"
      >
        <div
          className="relative w-full max-w-md rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #140028 0%, #2D0060 60%, #1A0030 100%)',
            border: '1px solid rgba(196,77,255,0.30)',
            boxShadow: '0 24px 64px rgba(196,77,255,0.20)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
            style={{ background: 'rgba(20,0,40,0.95)', borderBottom: '1px solid rgba(196,77,255,0.20)' }}
          >
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: '#C44DFF' }} />
                {step === 1 && `The ${petName} Birthday Box`}
                {step === 2 && 'Health & Allergy Check'}
                {step === 3 && 'Box Confirmed!'}
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
                    onConfirm={handleConfirmOrder}
                    isOrdering={isOrdering}
                  />
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <StepSuccess petName={petName} orderId={orderId} onClose={handleClose} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BirthdayBoxBuilder;
