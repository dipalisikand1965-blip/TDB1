/**
 * MealBoxCard.jsx — The Doggy Company®
 * "The {Pet} Meal Box" — Mira-curated 6-screen meal plan builder.
 *
 * Screen flow:
 *   Teaser Card (always on page)
 *   → Screen 1: Meals per day (1 or 2)
 *   → Screen 2: Review curated slots (Step 1/3)
 *   → Screen 3: Browse & swap alternatives
 *   → Screen 4: Delivery frequency (Step 2/3)
 *   → Screen 5: Allergy & health confirmation (Step 3/3)
 *   → Screen 6: Confirmed — ticket number
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, ChevronRight, ChevronLeft, Check, Loader2,
  RefreshCw, ShieldCheck, Clock, Package, Sparkles, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { usePillarContext } from '../../context/PillarContext';
import { useAuth } from '../../context/AuthContext';
import { applyMiraFilter } from '../../hooks/useMiraFilter';

const API = process.env.REACT_APP_BACKEND_URL;

// ── Helpers ─────────────────────────────────────────────────────────────────
const getPetAllergies = (pet) => {
  const NONE = /^(no|none|none_confirmed|no_allergies|na|n\/a)$/i;
  const sets = new Set();
  const push = (v) => {
    if (!v) return;
    const arr = Array.isArray(v) ? v : String(v).split(/,|;/).map(s => s.trim());
    arr.forEach(a => { if (a && !NONE.test(a.trim())) sets.add(a.toLowerCase()); });
  };
  push(pet?.health_data?.allergies);
  push(pet?.doggy_soul_answers?.food_allergies);
  push(pet?.preferences?.allergies);
  return [...sets];
};

const getFavProtein = (pet) => {
  const raw = pet?.doggy_soul_answers?.favorite_protein || '';
  return raw.replace(/\s*(treats?|biscuits?|food|meal|diet)\s*$/i, '').trim();
};

const getHealthCondition = (pet) => {
  const cond = pet?.health_data?.chronic_conditions;
  if (!cond) return '';
  const arr = Array.isArray(cond) ? cond : [cond];
  const first = arr.find(c => c && c.toLowerCase() !== 'none' && c.toLowerCase() !== 'none_confirmed');
  return first || '';
};

const FREQ_OPTIONS = [
  { id: 'weekly', label: 'Every Week', desc: 'Fresh every 7 days', icon: '📦' },
  { id: 'fortnightly', label: 'Every Fortnight', desc: 'Delivered every 2 weeks', icon: '🗓️' },
  { id: 'monthly', label: 'Monthly', desc: 'One big box per month', icon: '📬' },
];

// ── Slot Row — compact slot display ─────────────────────────────────────────
const SlotRow = ({ slot, onSwap }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-3 rounded-xl p-3"
    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
  >
    <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base"
      style={{ background: 'rgba(196,77,255,0.18)' }}>
      {slot.emoji}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold tracking-wide" style={{ color: 'rgba(196,77,255,0.75)', fontSize: '10px' }}>
        {slot.label?.toUpperCase()}
      </p>
      <p className="text-sm font-semibold text-white leading-tight truncate">{slot.pick?.name}</p>
      {slot.pick?.mira_reason && (
        <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{slot.pick.mira_reason}</p>
      )}
    </div>
    {slot.alternatives?.length > 0 && (
      <button onClick={() => onSwap(slot)} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        title="Swap product">
        <RefreshCw size={13} style={{ color: 'rgba(255,255,255,0.5)' }} />
      </button>
    )}
    {slot.pick?.is_mira_imagines && (
      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(196,77,255,0.18)', color: '#C44DFF', fontSize: '10px' }}>
        Imagines
      </span>
    )}
  </motion.div>
);

// ── Modal wrapper ────────────────────────────────────────────────────────────
const Modal = ({ onClose, children }) => createPortal(
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)', zIndex: 10002 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#1a0a12', border: '1px solid rgba(196,77,255,0.20)', maxHeight: '92vh' }}
      >
        {/* Scrollable content area */}
        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>,
  document.body
);

// ── Screen header ────────────────────────────────────────────────────────────
const ScreenHeader = ({ title, subtitle, step, totalSteps, onClose, onBack }) => (
  <div className="flex items-start justify-between p-5 pb-3">
    <div className="flex items-center gap-2">
      {onBack && (
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-white/10 transition-colors mr-1">
          <ChevronLeft size={16} className="text-white/60" />
        </button>
      )}
      <div>
        {step && (
          <p className="text-xs font-bold tracking-widest mb-0.5" style={{ color: 'rgba(196,77,255,0.7)', fontSize: '10px' }}>
            STEP {step} OF {totalSteps}
          </p>
        )}
        <h2 className="text-base font-bold text-white leading-tight">{title}</h2>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.50)' }}>{subtitle}</p>}
      </div>
    </div>
    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
      <X size={16} className="text-white/50" />
    </button>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function MealBoxCard() {
  const { currentPet } = usePillarContext();
  const { user } = useAuth();
  const pet = currentPet;
  const petName = pet?.name || 'your dog';

  // Product data
  const [slotsData, setSlotsData] = useState(null);
  const [teaserDesc, setTeaserDesc] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Flow state
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState(1); // 1-6
  const [mealsPerDay, setMealsPerDay] = useState(2);
  const [slots, setSlots] = useState([]);
  const [swapSlot, setSwapSlot] = useState(null); // slot being swapped (screen 3)
  const [deliveryFreq, setDeliveryFreq] = useState('weekly');
  const [allergiesConfirmed, setAllergiesConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const allergies = getPetAllergies(pet);
  const favProtein = getFavProtein(pet);
  const healthCondition = getHealthCondition(pet);

  // Load products when card mounts or pet changes
  const loadProducts = useCallback(async () => {
    if (!pet?.id) return;
    setLoadingProducts(true);
    try {
      const params = new URLSearchParams({
        pet_id: pet.id,
        allergies: allergies.join(','),
        fav_protein: favProtein,
        health_condition: healthCondition,
        pet_name: petName,
        pet_breed: pet?.breed || '',
      });
      const res = await fetch(`${API}/api/mira/meal-box-products?${params}`);
      if (res.ok) {
        const data = await res.json();

        // ── Breed mismatch guard ──────────────────────────────────────────
        // Product names like "Cocker Spaniel Food Bowl" should never be the
        // top pick for an Indie (or any non-Cocker-Spaniel) dog.
        // applyMiraFilter can't catch this because breed_tags are empty in DB.
        // This function re-sorts a ranked pool so:
        //   1. Breed-matched names (e.g. "Indie Bowl") come first
        //   2. Generic names (no breed in name) come next
        //   3. Breed-mismatched names come last (last resort only)
        const BREED_NAMES_IN_PRODUCTS = [
          'cocker spaniel','labrador','golden retriever','german shepherd',
          'rottweiler','irish setter','poodle','beagle','dachshund','pug',
          'boxer','husky','dalmatian','bulldog','shih tzu','maltese',
          'chihuahua','dobermann','doberman','great dane','saint bernard',
          'border collie','australian shepherd','indie','mixed breed',
        ];
        const guardBreedMismatch = (ranked, petBreed) => {
          const breed = (petBreed || '').toLowerCase();
          const matched = [], generic = [], mismatched = [];
          for (const p of ranked) {
            const name = (p.name || '').toLowerCase();
            const foundBreed = BREED_NAMES_IN_PRODUCTS.find(b => name.includes(b));
            if (!foundBreed)                                              generic.push(p);
            else if (breed.includes(foundBreed) || foundBreed.includes(breed)) matched.push(p);
            else                                                          mismatched.push(p);
          }
          return [...matched, ...generic, ...mismatched];
        };

        // ── Wire applyMiraFilter + breed guard ───────────────────────────
        const reRanked = (data.slots || []).map(slot => {
          const pool = [slot.pick, ...(slot.alternatives || [])].filter(Boolean);
          const miraRanked  = applyMiraFilter(pool, pet);
          const finalRanked = guardBreedMismatch(miraRanked, pet?.breed);
          const [newPick, ...newAlts] = finalRanked;
          const reason = newPick?.miraReason || newPick?.mira_reason ||
            (newPick?.name?.toLowerCase().includes((pet?.breed||'').toLowerCase())
              ? `Matched for ${pet?.breed}` : 'Best allergy-safe option for Mojo');
          return {
            ...slot,
            pick: newPick ? { ...newPick, mira_reason: reason } : slot.pick,
            alternatives: newAlts,
          };
        });
        setSlotsData(reRanked);
        setTeaserDesc(data.teaser_desc || '');
      }
    } catch (e) {
      console.error('[MealBox] Failed to load products', e);
    } finally {
      setLoadingProducts(false);
    }
  }, [pet?.id]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Compute active slots based on mealsPerDay
  const activeSlots = mealsPerDay === 1
    ? (slotsData || []).filter(s => s.key !== 'evening')
    : (slotsData || []);

  // Open modal and init slots
  const openModal = () => {
    // If products haven't loaded yet, trigger a load
    if (!slotsData && !loadingProducts) { loadProducts(); }
    setSlots(activeSlots);
    setScreen(1);
    setSwapSlot(null);
    setAllergiesConfirmed(false);
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  // When screen 2 is shown and slotsData is null, auto-retry loading products
  useEffect(() => {
    if (screen === 2 && !slotsData && !loadingProducts) { loadProducts(); }
    if (open) setSlots(mealsPerDay === 1
      ? (slotsData || []).filter(s => s.key !== 'evening')
      : (slotsData || []));
  }, [mealsPerDay, slotsData, open, screen, loadingProducts, loadProducts]);

  const handleSwap = (targetSlot, newProduct) => {
    setSlots(prev => prev.map(s =>
      s.key === targetSlot.key
        ? { ...s, pick: { ...newProduct, is_mira_pick: true, mira_reason: 'Swapped by you' } }
        : s
    ));
    setSwapSlot(null);
    setScreen(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // ── Canonical flow: tdc.book + bookViaConcierge → admin inbox ──
      const { tdc } = await import('../../utils/tdc_intent');
      const { bookViaConcierge } = await import('../../utils/MiraCardActions');
      tdc.book({ service: `${petName}'s Meal Box`, pillar: 'dine', pet, channel: 'dine_meal_box_builder' });
      await bookViaConcierge({
        service: `${petName}'s Custom Meal Box — ${mealsPerDay}x/day, ${deliveryFreq} delivery`,
        pillar: 'dine', channel: 'dine_meal_box_builder',
        notes: `Allergies confirmed: ${allergiesConfirmed}. Slots: ${slots.map(s=>s.pick?.name||s.label).join(', ')}`,
      });

      // Also try the concierge endpoint (if it exists)
      const res = await fetch(`${API}/api/concierge/meal-box`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_id: pet?.id || '',
          pet_name: petName,
          meals_per_day: mealsPerDay,
          delivery_frequency: deliveryFreq,
          allergies_confirmed: allergiesConfirmed,
          slots: slots.map(s => ({ key: s.key, label: s.label, pick: s.pick })),
          user_email: user?.email || '',
          user_name: user?.name || user?.full_name || '',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTicketId(data.ticket_id);
        setScreen(6);
      } else {
        throw new Error(data.detail || 'Submission failed');
      }
    } catch (e) {
      toast.error('Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Teaser card (always visible) ─────────────────────────────────────────
  const chips = [
    favProtein ? `${favProtein} morning bowl` : null,
    favProtein ? `${favProtein} evening dinner` : null,
    favProtein ? `${favProtein} treats daily` : null,
    'Treatment-safe supplement',
  ].filter(Boolean);

  if (!pet) return null;

  return (
    <>
      {/* ── Teaser Card ── */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #4a0a1a 0%, #2d0510 50%, #1a0a0a 100%)',
          border: '1px solid rgba(196,77,255,0.15)',
        }}
        data-testid="meal-box-teaser"
      >
        {/* Subtle glow */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(196,77,255,0.12) 0%, transparent 70%)' }} />

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badge */}
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles size={11} style={{ color: '#C44DFF' }} />
              <span className="text-xs font-bold tracking-widest" style={{ color: 'rgba(196,77,255,0.80)', fontSize: '10px' }}>
                CURATED BY MIRA FOR {petName.toUpperCase()}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold leading-tight mb-2" style={{ color: '#fff' }}>
              The{' '}
              <span style={{ color: '#FF8C42' }}>{petName}</span>
              {' '}Meal Box
            </h3>

            {/* Description */}
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.60)' }}>
              {loadingProducts
                ? 'Mira is personalising your plan…'
                : teaserDesc || `Mira has built one meal plan that covers who ${petName} actually is.`}
            </p>

            {/* Chips */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {chips.map((chip, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(255,140,66,0.15)', color: '#FF8C42', fontSize: '11px' }}>
                  {chip}
                </span>
              ))}
              {chips.length > 3 && (
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                  +1 more
                </span>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={openModal}
                disabled={loadingProducts}
                data-testid="build-meal-box-btn"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF8C42, #C44DFF)', color: '#fff' }}
              >
                {loadingProducts ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
                Build {petName}'s Box
              </button>
              <button
                onClick={openModal}
                data-testid="meal-box-view-btn"
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Meal Box <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Icon */}
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'rgba(196,77,255,0.12)', border: '1px solid rgba(196,77,255,0.20)' }}>
            🍽️
          </div>
        </div>

        <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.30)' }}>Curated by Mira</p>
      </div>

      {/* ── Modal ── */}
      {open && (
        <Modal onClose={closeModal}>
          <AnimatePresence mode="wait">

            {/* Screen 1 — Meals per day */}
            {screen === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ScreenHeader title={`${petName}'s Meal Box`} subtitle="How many meals does your dog eat per day?" onClose={closeModal} />
                <div className="px-5 pb-5 space-y-3">
                  {[1, 2].map(n => (
                    <button key={n} onClick={() => setMealsPerDay(n)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                      style={{
                        background: mealsPerDay === n ? 'rgba(196,77,255,0.18)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${mealsPerDay === n ? 'rgba(196,77,255,0.50)' : 'rgba(255,255,255,0.10)'}`,
                      }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: mealsPerDay === n ? 'rgba(196,77,255,0.20)' : 'rgba(255,255,255,0.08)' }}>
                        {n === 1 ? '☀️' : '🌅🌙'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{n} meal{n > 1 ? 's' : ''} a day</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {n === 1 ? 'Morning meal + treats + supplement' : 'Morning, evening, treats & supplement'}
                        </p>
                      </div>
                      {mealsPerDay === n && <Check size={14} className="ml-auto" style={{ color: '#C44DFF' }} />}
                    </button>
                  ))}
                  <button onClick={() => setScreen(2)}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2 transition-all hover:scale-[1.01]"
                    style={{ background: 'linear-gradient(135deg,#C44DFF,#FF8C42)', color: '#fff' }}
                    data-testid="meal-box-next-s1">
                    Continue <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Screen 2 — Review slots */}
            {screen === 2 && !swapSlot && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ScreenHeader title="Mira's Curated Plan" subtitle={loadingProducts || (slots.length === 0 && slotsData === null) ? `Building plan for ${petName}…` : `${slots.length} slot${slots.length !== 1 ? 's' : ''} for ${petName}`}
                  step={1} totalSteps={3} onClose={closeModal} onBack={() => setScreen(1)} />
                <div className="px-5 pb-5 space-y-2">
                  {loadingProducts ? (
                    <div className="py-8 flex flex-col items-center gap-3">
                      <div style={{ width: 32, height: 32, border: '3px solid rgba(196,77,255,0.20)', borderTopColor: '#C44DFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Mira is building {petName}'s plan…</p>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>Having trouble loading the plan. Tap to retry.</p>
                      <button onClick={loadProducts} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(196,77,255,0.20)', color: '#C44DFF' }}>Retry</button>
                    </div>
                  ) : (
                    <>
                      {slots.map(slot => (
                        <SlotRow key={slot.key} slot={slot} onSwap={s => { setSwapSlot(s); setScreen(3); }} />
                      ))}
                      <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(196,77,255,0.08)', border: '1px solid rgba(196,77,255,0.12)' }}>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>
                          Tap the swap icon to change any item. Mira has pre-selected the best match for {petName}.
                        </p>
                      </div>
                      <button onClick={() => setScreen(4)}
                        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-1 transition-all hover:scale-[1.01]"
                        style={{ background: 'linear-gradient(135deg,#C44DFF,#FF8C42)', color: '#fff' }}
                        data-testid="meal-box-next-s2">
                        Looks good — Next <ChevronRight size={14} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Screen 3 — Browse & swap */}
            {screen === 3 && swapSlot && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ScreenHeader title={`Swap ${swapSlot.label}`} subtitle="Choose a replacement"
                  onClose={closeModal} onBack={() => { setSwapSlot(null); setScreen(2); }} />
                <div className="px-5 pb-5 space-y-2">
                  {/* Current pick */}
                  <p className="text-xs font-bold tracking-widest mb-2" style={{ color: 'rgba(196,77,255,0.7)', fontSize: '10px' }}>
                    MIRA'S PICK (CURRENT)
                  </p>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(196,77,255,0.10)', border: '1px solid rgba(196,77,255,0.30)' }}>
                    <p className="text-sm font-semibold text-white">{swapSlot.pick?.name}</p>
                    {swapSlot.pick?.mira_reason && (
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{swapSlot.pick.mira_reason}</p>
                    )}
                  </div>

                  {/* Alternatives */}
                  {swapSlot.alternatives?.length > 0 ? (
                    <>
                      <p className="text-xs font-bold tracking-widest mt-3" style={{ color: 'rgba(255,255,255,0.40)', fontSize: '10px' }}>
                        ALTERNATIVES
                      </p>
                      {swapSlot.alternatives.map((alt, i) => (
                        <button key={i} onClick={() => handleSwap(swapSlot, alt)}
                          className="w-full text-left p-3 rounded-xl transition-all hover:bg-white/10"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                          <p className="text-sm font-semibold text-white">{alt.name}</p>
                          {alt.description && (
                            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{alt.description}</p>
                          )}
                          <p className="text-xs font-bold mt-1" style={{ color: '#FF8C42' }}>Select →</p>
                        </button>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-center py-4" style={{ color: 'rgba(255,255,255,0.40)' }}>
                      No alternatives available — Mira's pick is the best option for {petName}.
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Screen 4 — Delivery frequency */}
            {screen === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ScreenHeader title="Delivery Frequency" subtitle="How often should we deliver?"
                  step={2} totalSteps={3} onClose={closeModal} onBack={() => setScreen(2)} />
                <div className="px-5 pb-5 space-y-2">
                  {FREQ_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => setDeliveryFreq(opt.id)}
                      className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                      style={{
                        background: deliveryFreq === opt.id ? 'rgba(196,77,255,0.18)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${deliveryFreq === opt.id ? 'rgba(196,77,255,0.50)' : 'rgba(255,255,255,0.10)'}`,
                      }}>
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{opt.label}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{opt.desc}</p>
                      </div>
                      {deliveryFreq === opt.id && <Check size={14} style={{ color: '#C44DFF' }} />}
                    </button>
                  ))}
                  <button onClick={() => setScreen(5)}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mt-2 transition-all hover:scale-[1.01]"
                    style={{ background: 'linear-gradient(135deg,#C44DFF,#FF8C42)', color: '#fff' }}
                    data-testid="meal-box-next-s4">
                    Continue <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Screen 5 — Health & allergy confirmation */}
            {screen === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ScreenHeader title="Health Check" subtitle={`Confirm before we finalise ${petName}'s box`}
                  step={3} totalSteps={3} onClose={closeModal} onBack={() => setScreen(4)} />
                <div className="px-5 pb-5 space-y-4">
                  {/* Allergy summary */}
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255,140,66,0.08)', border: '1px solid rgba(255,140,66,0.20)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck size={14} style={{ color: '#FF8C42' }} />
                      <p className="text-xs font-bold" style={{ color: '#FF8C42' }}>ALLERGY PROFILE</p>
                    </div>
                    {allergies.length > 0 ? (
                      <p className="text-sm text-white">
                        Avoiding: <span className="font-semibold">{allergies.join(', ')}</span>
                      </p>
                    ) : (
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>No known allergies on file.</p>
                    )}
                    {healthCondition && (
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
                        Health note: {healthCondition}
                      </p>
                    )}
                  </div>

                  {/* Confirmation checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div
                      onClick={() => setAllergiesConfirmed(v => !v)}
                      className="flex-shrink-0 w-5 h-5 rounded mt-0.5 flex items-center justify-center transition-colors"
                      style={{
                        background: allergiesConfirmed ? '#C44DFF' : 'transparent',
                        border: `2px solid ${allergiesConfirmed ? '#C44DFF' : 'rgba(255,255,255,0.30)'}`,
                      }}>
                      {allergiesConfirmed && <Check size={11} className="text-white" />}
                    </div>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      I confirm the allergy and health information above is accurate for {petName}. I understand my concierge will review the plan before delivery.
                    </p>
                  </label>

                  <button
                    onClick={handleSubmit}
                    disabled={!allergiesConfirmed || submitting}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#C44DFF,#FF8C42)', color: '#fff' }}
                    data-testid="meal-box-confirm-btn">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {submitting ? 'Confirming…' : "Confirm & Send to Concierge®"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Screen 6 — Confirmed */}
            {screen === 6 && (
              <motion.div key="s6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(196,77,255,0.18)' }}>
                    <Check size={28} style={{ color: '#C44DFF' }} />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">{petName}'s Meal Box is Confirmed!</h2>
                  <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    Your concierge will reach out within 24 hours to finalise and schedule delivery.
                  </p>

                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
                    style={{ background: 'rgba(196,77,255,0.12)', border: '1px solid rgba(196,77,255,0.25)' }}>
                    <span className="text-xs font-bold tracking-widest" style={{ color: '#C44DFF', fontSize: '10px' }}>TICKET</span>
                    <span className="text-sm font-bold text-white">{ticketId}</span>
                  </div>

                  <div className="space-y-2 text-left mb-5">
                    {[
                      { icon: Clock, text: 'Concierge® review within 24 hours' },
                      { icon: Package, text: `${deliveryFreq.charAt(0).toUpperCase() + deliveryFreq.slice(1)} delivery scheduled` },
                      { icon: ShieldCheck, text: 'Allergy & health check completed' },
                    ].map(({ icon: Icon, text }, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Icon size={13} style={{ color: 'rgba(196,77,255,0.70)' }} />
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>{text}</p>
                      </div>
                    ))}
                  </div>

                  <button onClick={closeModal}
                    className="w-full py-3 rounded-xl font-semibold text-sm"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.80)' }}
                    data-testid="meal-box-done-btn">
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Modal>
      )}
    </>
  );
}
