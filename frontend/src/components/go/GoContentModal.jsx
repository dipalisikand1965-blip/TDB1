/**
 * GoContentModal.jsx
 * Go dimension modal — mirrors CareContentModal architecture.
 * Opens from GoCategoryStrip pills showing pet-personalised products.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Check } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../ProductCard';
import FlatArtPickerCard from '../common/FlatArtPickerCard';
import SoulMadeModal from '../SoulMadeModal';
import PersonalisedBreedSection from '../common/PersonalisedBreedSection';
import SoulMadeCollection from '../SoulMadeCollection';

// Utility: boarding_comfort → Boarding Comfort
const toLabel = s => s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : s;

// ─── Teal palette ─────────────────────────────────────────────────────────────
const fmtTab = (t) => t === 'All' || t === 'all' ? t : t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const G = {
  teal:      '#1ABC9C',
  deep:      '#0D3349',
  deepMid:   '#1A5276',
  light:     '#76D7C4',
  pale:      '#D1F2EB',
  cream:     '#E8F8F5',
  gold:      '#C9973A',
  darkText:  '#0D3349',
  mutedText: '#5D6D7E',
  border:    'rgba(26,188,156,0.18)',
};

// ─── Category config — maps strip ID → API category filter ───────────────────
const CAT_CONFIG = {
  soul:     { emoji: '✨', label: 'Soul Go Picks',         keywords: [], special: 'soul' },
  mira:     { emoji: '🪄', label: "Mira's Go Picks",       keywords: [], special: 'mira' },
  safety:   { emoji: '🛡️', label: 'Safety & Security',   keywords: ['safety'] },
  calming:  { emoji: '😌', label: 'Calming & Comfort',    keywords: ['calm', 'travel-calm'] },
  carriers: { emoji: '🎒', label: 'Carriers & Crates',    keywords: ['carrier', 'travel-carrier'] },
  feeding:  { emoji: '🥣', label: 'Feeding & Hydration',  keywords: ['feeding', 'travel-feed'] },
  health:   { emoji: '💊', label: 'Health & Documents',   keywords: ['health', 'travel-health'] },
  stay:     { emoji: '🏡', label: 'Stay & Board',          keywords: ['boarding', 'stay'] },
  soul_made:{ emoji: '✦',  label: 'Soul Made™',            keywords: [], special: 'soul_made' },
};

// ─── Mira quotes per category ─────────────────────────────────────────────────
const MIRA_QUOTES = {
  safety:   (n, size) => size
    ? `Every safety product here is sized for ${n}'s ${size.toLowerCase()} build — GPS, crash-tested harness, and ID tags matched.`
    : `These are the safety essentials I'd insist on for every trip with ${n}.`,
  calming:  (n, anxious) => anxious
    ? `${n} has travel anxiety — I've put the most effective calming options first. The spray + chew combination works best.`
    : `These calming products help ${n} stay relaxed during car, train, or air travel.`,
  carriers: (n, size) => size
    ? `I've filtered to carriers sized for ${size.toLowerCase()} dogs. Everything here is IATA-compliant for cabin or cargo.`
    : `These carriers are IATA-approved and accepted on most domestic and international flights.`,
  feeding:  (n) => `Hydration is critical on long journeys. These are the feeding and water essentials I'd pack for ${n}.`,
  health:   (n, cond) => cond
    ? `I've made sure everything here is safe for ${n}'s ${cond}. The travel first aid kit is non-negotiable.`
    : `Travel health essentials — first aid, motion sickness, and document organiser for ${n}'s records.`,
  stay:     (n) => `When you travel, ${n} needs the right stay. I can find boarding, arrange a sitter, or discover pet-friendly hotels.`,
};

// ─── Pet helpers ──────────────────────────────────────────────────────────────
const ALLERGY_CLEAN = /^(no|none|none_confirmed|no_allergies|no allergies|na|n\/a|unknown)$/i;

const getPetAllergies = (pet) => {
  const sets = new Set();
  const push = (v) => {
    if (!v) return;
    const arr = Array.isArray(v) ? v : v.split(/,|;/).map(s => s.trim());
    arr.forEach(a => { if (a && !ALLERGY_CLEAN.test(a.trim())) sets.add(a.toLowerCase()); });
  };
  push(pet?.allergies); push(pet?.health_data?.allergies); push(pet?.health?.allergies);
  push(pet?.doggy_soul_answers?.food_allergies);
  return [...sets];
};

const getPetSize = (pet) => pet?.doggy_soul_answers?.size || pet?.size || null;

const getHealthCondition = (pet) => {
  const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
  if (!raw) return null;
  const str = Array.isArray(raw) ? raw.join(', ') : String(raw);
  return str.toLowerCase() === 'none' || str.trim() === '' ? null : str;
};

const getTravelAnxiety = (pet) => {
  const triggers = pet?.doggy_soul_answers?.anxiety_triggers || pet?.anxietyTriggers || [];
  const arr = Array.isArray(triggers) ? triggers : [triggers];
  return arr.some(t => t && (String(t).toLowerCase().includes('car') || String(t).toLowerCase().includes('travel')));
};

// ─── Mira intelligence — allergy filter + size sort ──────────────────────────
function applyMiraFilter(products, allergies, size, condition) {
  const allergyTerms = allergies.map(a => a.toLowerCase().trim());
  const sizeLower = (size || '').toLowerCase();

  return products
    .filter(p => {
      if (!allergyTerms.length) return true;
      const text = `${p.name} ${p.description || ''}`.toLowerCase();
      const free = (p.allergy_free || '').toLowerCase();
      return !allergyTerms.some(a => {
        if (free.includes(`${a}-free`) || free.includes(`${a} free`)) return false;
        if (text.includes(`${a}-free`) || text.includes(`${a} free`)) return false;
        return text.replace(new RegExp(`${a}[- ]free`, 'gi'), '').includes(a);
      });
    })
    .map(p => {
      const text = `${p.name} ${p.description || ''}`.toLowerCase();
      const tag = (p.mira_tag || '').toLowerCase();
      const sizeMatch = sizeLower && (text.includes(sizeLower) || tag.includes('size match'));
      const healthSafe = condition && (tag.includes('treatment') || (p.allergy_free || '').toLowerCase().includes('treatment-safe'));
      let mira_hint = p.mira_hint || null;
      if (!mira_hint) {
        if (sizeMatch) mira_hint = `Sized for a ${size} dog`;
        else if (healthSafe) mira_hint = `Safe for ${condition}`;
        else if (p.mira_tag) mira_hint = p.mira_tag;
      }
      return { ...p, mira_hint, _sizeMatch: !!sizeMatch, _healthSafe: !!healthSafe };
    })
    .sort((a, b) => {
      if (a._sizeMatch && !b._sizeMatch) return -1;
      if (!a._sizeMatch && b._sizeMatch) return 1;
      if (a._healthSafe && !b._healthSafe) return -1;
      if (!a._healthSafe && b._healthSafe) return 1;
      return 0;
    });
}

// ─── Mira Imagines for Go ─────────────────────────────────────────────────────
const MiraGoImaginesCard = ({ item, pet, apiUrl, token }) => {
  const [state, setState] = useState('idle');
  const petName = pet?.name || 'your dog';

  const sendToConcierge = async () => {
    setState('sending');
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      await fetch(`${apiUrl}/api/service_desk/attach_or_create_ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          parent_id: storedUser?.id || storedUser?.email || 'guest',
          pet_id: pet?.id || 'unknown',
          pillar: 'go',
          intent_primary: 'mira_imagines_request',
          intent_secondary: [item.name],
          life_state: 'go',
          channel: 'go_miras_picks_imagines',
          initial_message: {
            sender: 'parent',
            source: 'go_miras_picks',
            text: `I'd love "${item.name}" for ${petName}. Mira imagined this — please help source it!`,
          },
        }),
      });
    } catch (err) { console.error('[MiraGoImaginesCard]', err); }
    setState('sent');
  };

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: `linear-gradient(135deg, #081a26, ${G.deep})`,
      border: `1.5px solid rgba(26,188,156,0.30)`,
      display: 'flex', flexDirection: 'column', minHeight: 220,
    }}>
      <div style={{
        position: 'relative', height: 120,
        background: `linear-gradient(135deg, ${G.deep}, ${G.deepMid})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 44 }}>{item.emoji || '✈️'}</span>
        <div style={{ position: 'absolute', top: 8, left: 8, background: G.teal, color: G.deep, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
          Mira Imagines
        </div>
      </div>
      <div style={{ flex: 1, padding: '10px 12px 4px' }}>
        <p style={{ fontWeight: 800, color: '#fff', fontSize: 12, lineHeight: 1.3, marginBottom: 4 }}>{item.name}</p>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>{item.description}</p>
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        {state === 'sent' ? (
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: G.light }}>
            <Check size={12} style={{ display: 'inline', marginRight: 4 }} /> Sent to Concierge®!
          </div>
        ) : (
          <button
            onClick={sendToConcierge}
            disabled={state === 'sending'}
            style={{
              width: '100%', background: `linear-gradient(135deg, ${G.teal}, ${G.deepMid})`,
              color: '#fff', border: 'none', borderRadius: 10, padding: '9px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              opacity: state === 'sending' ? 0.7 : 1,
            }}
            data-testid={`go-imagine-btn-${item.id}`}
          >
            <Send size={11} />
            {state === 'sending' ? 'Sending…' : 'Request a Quote →'}
          </button>
        )}
      </div>
    </div>
  );
};

// Generate Mira Imagines for Go based on pet profile
const generateGoImagines = (pet, category) => {
  const petName = pet?.name || 'your dog';
  const breed = (pet?.breed || '').trim();
  const size = getPetSize(pet);
  const anxious = getTravelAnxiety(pet);
  const condition = getHealthCondition(pet);

  const map = {
    safety: [
      { id: 'go-imagine-safety-1', emoji: '🛡️', name: size ? `${size} Dog Safety Bundle` : `${petName}'s Safety Kit`, description: `GPS tracker, crash-tested harness, and ID tags — everything to keep ${petName} safe on every journey.` },
      { id: 'go-imagine-safety-2', emoji: '🔖', name: `Custom ID Tag for ${petName}`, description: `Personalised with ${petName}'s name and your contact — Mira's #1 travel essential.` },
    ],
    calming: [
      { id: 'go-imagine-calm-1', emoji: '😌', name: anxious ? `${petName}'s Travel Anxiety Kit` : `${petName}'s Calming Pack`, description: anxious ? `Complete calming system — spray, chews, and compression wrap designed for dogs with travel anxiety.` : `Gentle calming spray and chews to keep ${petName} relaxed on the road or in the air.` },
    ],
    carriers: [
      { id: 'go-imagine-carrier-1', emoji: '🎒', name: size ? `IATA ${size} Dog Carrier` : `${petName}'s IATA Carrier`, description: `Airline-approved, ${size ? size.toLowerCase() + '-sized, ' : ''}with ventilation mesh and comfort padding — ready for cabin or cargo.` },
    ],
    feeding: [
      { id: 'go-imagine-feed-1', emoji: '🥣', name: `${petName}'s Travel Feeding Kit`, description: `Collapsible bowl, insulated water bottle, and a travel-sized food container — Mira's hydration essentials.` },
    ],
    health: [
      { id: 'go-imagine-health-1', emoji: '💊', name: condition ? `${petName}'s Travel First Aid (${condition}-safe)` : `${petName}'s Travel First Aid Kit`, description: condition ? `Vet-approved first aid kit with ${condition}-safe products, vet records organiser, and motion sickness relief.` : `Everything from bandages to motion sickness meds — Mira's travel health kit for ${petName}.` },
    ],
    stay: [
      { id: 'go-imagine-stay-1', emoji: '🏡', name: `${petName}'s Perfect Stay`, description: breed ? `A boutique, verified pet-friendly property curated for ${breed}s — sourced by our Concierge® team.` : `Mira researches boutique stays that genuinely love dogs — not just pet-tolerant.` },
      { id: 'go-imagine-stay-2', emoji: '🐾', name: `Premium Boarding for ${petName}`, description: `A personally vetted boarding facility with daily updates and the right environment for ${petName}.` },
    ],
  };

  return (map[category] || [
    { id: 'go-imagine-default', emoji: '✈️', name: `${petName}'s Travel Kit`, description: `Mira curates the perfect go-bag for ${petName} — everything needed for a smooth journey.` },
  ]).slice(0, 3);
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
const GoContentModal = ({ isOpen, onClose, category, pet }) => {
  const [products, setProducts] = useState([]);
  const [flatArtProducts, setFlatArtProducts] = useState([]);
  const [yappyIllustrations, setYappyIllustrations] = useState([]);
  const [artStyle, setArtStyle] = useState('watercolour');
  const [loading, setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [tabs, setTabs]         = useState(['All']);
  const [goTab, setGoTab]       = useState("products"); // products | personalised
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const { token } = useAuth();
  const apiUrl = getApiUrl();

  // Reset inner tab when category changes
  useEffect(() => { if (isOpen) setGoTab("products"); }, [isOpen, category]);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const config   = CAT_CONFIG[category] || { emoji: '✈️', label: category, keywords: [] };
  const petName  = pet?.name || 'your dog';
  const allergies = useMemo(() => getPetAllergies(pet), [pet]);
  const size     = getPetSize(pet);
  const condition = getHealthCondition(pet);
  const anxious  = getTravelAnxiety(pet);

  const imagines = useMemo(() => generateGoImagines(pet, category), [pet, category]);

  const miraQuote = (() => {
    const fn = MIRA_QUOTES[category];
    if (!fn) return `These go products are matched to ${petName}'s profile.`;
    if (category === 'safety') return fn(petName, size);
    if (category === 'calming') return fn(petName, anxious);
    if (category === 'carriers') return fn(petName, size);
    if (category === 'health') return fn(petName, condition);
    return fn(petName);
  })();

  // Fetch Go products — deps use pet?.id to avoid re-fetch on every petData reference change
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setActiveTab('All');
    setProducts([]);
    setFlatArtProducts([]);
    setYappyIllustrations([]);
    setArtStyle('watercolour');

    const petAllergies = getPetAllergies(pet);
    const petSize = getPetSize(pet);
    const petCondition = getHealthCondition(pet);

    // ── Soul Made™: breed-specific products ──────
    if (category === 'soul_made') {
      const breedParam = encodeURIComponent((pet?.breed || '').trim().toLowerCase());
      Promise.all([
        fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedParam}&pillar=go&limit=60`),
        fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedParam}&flat_only=true&limit=60`),
        fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedParam}&product_type=birthday_cake&limit=3`),
      ])
        .then(([r1, r2, r3]) => Promise.all([
          r1.ok ? r1.json() : { products: [] },
          r2.ok ? r2.json() : { products: [] },
          r3.ok ? r3.json() : { products: [] },
        ]))
        .then(([data1, data2, data3]) => {
          const bp = (data1.products || []).filter(p =>
            p.product_type !== 'birthday_cake' && p.product_type !== 'Birthday Cake'
          );
          const subCats = [...new Set(bp.map(p => p.sub_category || p.product_type).filter(Boolean))];
          const breedSlug = (pet?.breed||'').trim().toLowerCase().replace(/\s+/g, '_');
          const filteredCats = subCats.filter(t => !/-play$|-shop$|-go$|-travel$/.test(t) || !breedSlug || t.toLowerCase().startsWith(breedSlug));
          setTabs(filteredCats.length > 0 ? ['All', ...filteredCats] : ['All']);
          setProducts(bp);
          setFlatArtProducts(data2.products || []);
          setYappyIllustrations(data3.products || []);
          setArtStyle('watercolour');
        })
        .catch(err => console.error('[GoContentModal soul_made]', err))
        .finally(() => setLoading(false));
      return;
    }

    // ── Special: Soul Go — AI scored picks across all go categories ──
    if (category === 'soul') {
      if (!pet?.id) { setLoading(false); return; }
      fetch(`${apiUrl}/api/mira/claude-picks/${pet.id}?pillar=go&limit=16&min_score=60&entity_type=product`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          const picks = (data?.picks || []);
          const intelligent = applyMiraFilter(picks, petAllergies, petSize, petCondition);
          const subCats = [...new Set(intelligent.map(p => p.sub_category).filter(Boolean))];
          setTabs(['All', ...subCats]);
          setProducts(intelligent);
        })
        .catch(err => console.error('[GoContentModal soul]', err))
        .finally(() => setLoading(false));
      return;
    }

    // ── Special: Mira's Picks — same as soul but more products + services mixed ──
    if (category === 'mira') {
      if (!pet?.id) { setLoading(false); return; }
      Promise.all([
        fetch(`${apiUrl}/api/mira/claude-picks/${pet.id}?pillar=go&limit=12&min_score=60&entity_type=product`).then(r => r.ok ? r.json() : null),
        fetch(`${apiUrl}/api/mira/claude-picks/${pet.id}?pillar=go&limit=6&min_score=60&entity_type=service`).then(r => r.ok ? r.json() : null),
      ])
        .then(([pData, sData]) => {
          const prods = pData?.picks || [];
          const svcs = sData?.picks || [];
          const merged = [];
          let pi = 0, si = 0;
          while (pi < prods.length || si < svcs.length) {
            if (pi < prods.length) merged.push(prods[pi++]);
            if (pi < prods.length) merged.push(prods[pi++]);
            if (si < svcs.length) merged.push(svcs[si++]);
          }
          const intelligent = applyMiraFilter(merged.slice(0, 18), petAllergies, petSize, petCondition);
          setTabs(['All']);
          setProducts(intelligent);
        })
        .catch(err => console.error('[GoContentModal mira]', err))
        .finally(() => setLoading(false));
      return;
    }

    const catConfig = CAT_CONFIG[category] || { keywords: [] };
    const keywords = catConfig.keywords || [];

    // Fetch all go products
    fetch(`${apiUrl}/api/admin/pillar-products?pillar=go&limit=200`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const all = data?.products || [];

        // Filter by category keywords
        let filtered = all.filter(p => {
          const cat = (p.category || '').toLowerCase();
          return keywords.some(kw => cat.includes(kw));
        });

        // If "stay" category and few results, include stay-related items
        if (filtered.length < 3 && category === 'stay') {
          filtered = all.filter(p => {
            const cat = (p.category || '').toLowerCase();
            const name = (p.name || '').toLowerCase();
            return cat.includes('board') || cat.includes('stay') || name.includes('boarding') || name.includes('sitting');
          });
        }

        // Apply Mira intelligence
        const intelligent = applyMiraFilter(filtered, petAllergies, petSize, petCondition);

        // Build sub-category tabs — filter out other breed tabs
        const subCats = [...new Set(intelligent.map(p => p.sub_category).filter(Boolean))];
        const breedSlug = (pet?.breed||'').trim().toLowerCase().replace(/\s+/g, '_');
        const filteredCats = subCats.filter(t => !/-play$|-shop$|-go$|-travel$/.test(t) || !breedSlug || t.toLowerCase().startsWith(breedSlug));
        setTabs(['All', ...filteredCats]);
        setProducts(intelligent);
      })
      .catch(err => console.error('[GoContentModal]', err))
      .finally(() => setLoading(false));
  }, [isOpen, category, pet?.id, apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleProducts = activeTab === 'All'
    ? products
    : products.filter(p => p.sub_category === activeTab || p.product_type === activeTab || p.category === activeTab);

  const filtered = products.length;
  const total    = products.length; // already filtered for allergy

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ position: 'fixed', inset: 0, zIndex: 10010, background: 'rgba(0,0,0,0.68)', display: 'flex', alignItems: isDesktop ? 'center' : 'flex-end', justifyContent: 'center', padding: isDesktop ? 24 : 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: isDesktop ? 24 : 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isDesktop ? 24 : 60 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{
              width: isDesktop ? 'min(860px, 92vw)' : '100%',
              maxHeight: isDesktop ? '90vh' : '92vh',
              background: '#fff',
              borderRadius: isDesktop ? 20 : '20px 20px 0 0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ background: `linear-gradient(135deg, ${G.deep}, ${G.deepMid})`, padding: '20px 24px 16px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(26,188,156,0.20)', border: '1px solid rgba(26,188,156,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {config.emoji}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'Georgia,serif' }}>{config.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                      for {petName}
                      {size ? ` · ${size} dog` : ''}
                      {anxious && category === 'calming' ? ' · Travel anxiety' : ''}
                    </p>
                  </div>
                </div>
                <button onClick={onClose} data-testid="go-modal-close"
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Mira quote */}
              <div style={{ background: 'rgba(26,188,156,0.15)', border: '1px solid rgba(26,188,156,0.30)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg, ${G.teal}, ${G.deepMid})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0, marginTop: 1 }}>✦</div>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.90)', lineHeight: 1.55, fontStyle: 'italic' }}>"{miraQuote}"</p>
              </div>
            </div>

            {/* Products / Personalised tab toggle */}
            <div style={{ display:'flex', borderBottom:`1px solid ${G.border}`, marginBottom:0, flexShrink:0, background:G.cream }}>
              {[["products","🎯 All Products"],["personalised","✦ Personalised"]].map(([tid,label]) => (
                <button key={tid} onClick={() => setGoTab(tid)} data-testid={`go-modal-tab-${tid}`}
                  style={{ flex:1, padding:"10px 0", background:"none", border:"none", borderBottom:goTab===tid?`2.5px solid ${G.teal}`:"2.5px solid transparent", color:goTab===tid?G.teal:"#888", fontSize:12, fontWeight:goTab===tid?700:400, cursor:"pointer" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Sub-category tabs */}
            {goTab === "products" && tabs.length > 1 && (
              <div style={{ display: 'flex', gap: 6, padding: '12px 20px', background: G.cream, borderBottom: `1px solid ${G.border}`, overflowX: 'auto', flexShrink: 0 }}>
                {tabs.map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${activeTab === tab ? G.teal : 'rgba(26,188,156,0.22)'}`, background: activeTab === tab ? G.teal : '#fff', fontSize: 11, fontWeight: 600, color: activeTab === tab ? '#fff' : G.mutedText, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {toLabel(tab)}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth:'none', msOverflowStyle:'none', padding: 20, paddingBottom: 80 }}>
              {goTab === "personalised" ? (
                <div>
                  <PersonalisedBreedSection pet={pet} pillar="go" />
                  {/* SoulMadeCollection removed — portraits issue */}
                </div>
              ) : loading ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>
                  <div style={{ width: 24, height: 24, border: `2px solid ${G.pale}`, borderTopColor: G.teal, borderRadius: '50%', animation: 'go-spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                  <style>{`@keyframes go-spin{to{transform:rotate(360deg)}}`}</style>
                  Loading {config.label} for {petName}…
                </div>
              ) : visibleProducts.length === 0 ? (
                /* Mira Imagines — when no products */
                <div>
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: G.darkText, marginBottom: 4 }}>Mira is imagining {config.label} for {petName}</p>
                    <p style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>
                      These don't exist in our range yet — tap any card and our Concierge® will source them for you.
                    </p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))', gap: 12 }}>
                    {imagines.map(item => (
                      <MiraGoImaginesCard key={item.id} item={item} pet={pet} apiUrl={apiUrl} token={token} />
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', fontSize: 12, color: '#888' }}>
                    <span style={{ color: '#27AE60', fontWeight: 700 }}>✓ {filtered} products for {petName}</span>
                    {allergies.length > 0 && <span style={{ color: G.teal }}>✗ {allergies.join(', ')}-free filtered</span>}
                    {size && <span style={{ color: G.deepMid, fontWeight: 600 }}>🎒 {size} dog sized</span>}
                  </div>

                  {/* Art style toggle — soul_made only */}
                  {category === 'soul_made' && visibleProducts.length > 0 && yappyIllustrations.length > 0 && (
                    <div style={{ display:'flex', background:'#E8F5F0', borderRadius:999, padding:3, marginBottom:16, gap:2, width:'fit-content' }}>
                      {['watercolour','flat_art'].map(s => (
                        <button key={s} onClick={() => setArtStyle(s)} style={{
                          padding:'5px 14px', borderRadius:999, border:'none',
                          background: artStyle===s ? '#27AE60' : 'transparent',
                          color: artStyle===s ? '#fff' : 'rgba(0,0,0,0.45)',
                          fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.15s',
                        }}>
                          {s==='watercolour' ? '🎨 Watercolour' : '🐾 Flat Art'}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Product grid */}
                  {category === 'soul_made' && artStyle === 'flat_art' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 16, marginBottom: 24 }}>
                      {visibleProducts.map((p, i) => (
                        <FlatArtPickerCard key={p.id || p.name || i} product={p} illustrations={yappyIllustrations} pet={pet} pillar="go" />
                      ))}
                    </div>
                  ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))', gap: 12, marginBottom: 24 }}>
                    {visibleProducts.map((p, i) => (
                      <div key={p.id || i} data-testid={`go-modal-product-${p.id}`} style={{ position: 'relative' }}>
                        {p._sizeMatch && (
                          <div style={{ position: 'absolute', top: -6, right: -6, zIndex: 2, background: G.teal, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>🎒</div>
                        )}
                        <ProductCard product={p} pillar="go" selectedPet={pet} />
                      </div>
                    ))}
                  </div>
                  )}

                  {/* Mira Imagines at bottom */}
                  {imagines.length > 0 && (
                    <div style={{ paddingTop: 20, borderTop: `1px solid ${G.pale}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.10em', color: G.deepMid }}>✦ Mira Imagines</span>
                        <span style={{ fontSize: 10, color: '#888' }}>— products Mira would source for {petName}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))', gap: 12 }}>
                        {imagines.map(item => (
                          <MiraGoImaginesCard key={item.id} item={item} pet={pet} apiUrl={apiUrl} token={token} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Soul Made trigger — show in soul_made category */}
              {category === 'soul_made' && !loading && (
                <div
                  data-testid="soul-made-trigger"
                  onClick={() => setSoulMadeOpen(true)}
                  style={{
                    margin:'24px 20px 8px', padding:'20px 20px 18px',
                    background:'linear-gradient(135deg, #1a0a2e 0%, #2d0a4e 50%, #1a0a2e 100%)',
                    border:'1.5px solid rgba(196,77,255,0.4)',
                    borderRadius:18, cursor:'pointer', position:'relative', overflow:'hidden',
                    boxShadow:'0 4px 24px rgba(196,77,255,0.18)',
                    transition:'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(196,77,255,0.32)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 24px rgba(196,77,255,0.18)'; }}
                >
                  <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,background:'radial-gradient(circle,rgba(196,77,255,0.15) 0%,transparent 70%)',pointerEvents:'none'}}/>
                  <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.15em',color:'#C44DFF',marginBottom:8}}>
                    {`\u2726 SOUL MADE\u2122 \u00B7 MADE ONLY FOR ${(petName||'YOUR DOG').toUpperCase()}`}
                  </div>
                  <div style={{fontSize:20,fontWeight:800,color:'#F5F0E8',fontFamily:'Georgia,serif',marginBottom:6,lineHeight:1.2}}>
                    {petName}'s face. On everything.
                  </div>
                  <div style={{fontSize:13,color:'rgba(245,240,232,0.55)',marginBottom:16}}>
                    Bandana · Portrait Frame · Party Hat · Cake Topper · Tote · and more
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#C44DFF,#9333EA)',borderRadius:30,padding:'10px 22px',fontSize:13,fontWeight:700,color:'#fff',boxShadow:'0 4px 16px rgba(196,77,255,0.4)'}}>
                      {`\u2726 Make something only ${petName} has`}
                    </div>
                    <div style={{fontSize:12,color:'rgba(245,240,232,0.35)',fontStyle:'italic',maxWidth:160,textAlign:'right',lineHeight:1.4}}>
                      Upload a photo · Concierge® creates it · Price on WhatsApp
                    </div>
                  </div>
                </div>
              )}
              {/* Soul Made cross-sell — show in ALL other categories */}
              {category !== 'soul_made' && (
                <div style={{ padding:'0 20px 8px' }}>
                  <div
                    data-testid="soul-made-cross-sell"
                    onClick={() => setSoulMadeOpen(true)}
                    style={{
                      margin:'16px 0 8px', padding:'20px 20px 18px',
                      background:'linear-gradient(135deg, #1a0a2e 0%, #2d0a4e 50%, #1a0a2e 100%)',
                      border:'1.5px solid rgba(196,77,255,0.4)',
                      borderRadius:18, cursor:'pointer', position:'relative', overflow:'hidden',
                      boxShadow:'0 4px 24px rgba(196,77,255,0.18)',
                      transition:'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(196,77,255,0.32)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 24px rgba(196,77,255,0.18)'; }}
                  >
                    <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,background:'radial-gradient(circle,rgba(196,77,255,0.15) 0%,transparent 70%)',pointerEvents:'none'}}/>
                    <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.15em',color:'#C44DFF',marginBottom:8}}>
                      {`\u2726 SOUL MADE\u2122 \u00B7 MADE ONLY FOR ${(petName||'YOUR DOG').toUpperCase()}`}
                    </div>
                    <div style={{fontSize:20,fontWeight:800,color:'#F5F0E8',fontFamily:'Georgia,serif',marginBottom:6,lineHeight:1.2}}>
                      {petName}'s face. On everything.
                    </div>
                    <div style={{fontSize:13,color:'rgba(245,240,232,0.55)',marginBottom:16}}>
                      Bandana · Portrait Frame · Party Hat · Cake Topper · Tote · and more
                    </div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#C44DFF,#9333EA)',borderRadius:30,padding:'10px 22px',fontSize:13,fontWeight:700,color:'#fff',boxShadow:'0 4px 16px rgba(196,77,255,0.4)'}}>
                        {`\u2726 Make something only ${petName} has`}
                      </div>
                      <div style={{fontSize:12,color:'rgba(245,240,232,0.35)',fontStyle:'italic',maxWidth:160,textAlign:'right',lineHeight:1.4}}>
                        Upload a photo · Concierge® creates it · Price on WhatsApp
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {soulMadeOpen && <SoulMadeModal pet={pet} pillar="go" pillarColor={G.teal} pillarLabel="Travel" onClose={() => setSoulMadeOpen(false)} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default GoContentModal;
