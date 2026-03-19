/**
 * CareContentModal.jsx
 * Care dimension modal — mirrors DineContentModal architecture.
 * Opens from CareCategoryStrip pills showing pet-personalised products.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Check } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import ProductCard from '../ProductCard';

// ─── Green palette ────────────────────────────────────────────────────────────
const G = {
  sage:      '#40916C',
  deepMid:   '#2D6A4F',
  pale:      '#D8F3DC',
  cream:     '#F0FFF4',
  darkText:  '#1B4332',
  mutedText: '#52796F',
  border:    'rgba(45,106,79,0.18)',
};

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_CONFIG = {
  grooming:    { emoji: '✂️',  label: 'Grooming',       dimKey: 'Grooming' },
  dental:      { emoji: '🦷',  label: 'Dental & Paw',   dimKey: 'Dental & Paw' },
  coat:        { emoji: '🌿',  label: 'Coat & Skin',    dimKey: 'Coat & Skin' },
  wellness:    { emoji: '🏥',  label: 'Wellness',        dimKey: 'Wellness Visits' },
  senior:      { emoji: '🌸',  label: 'Senior Care',     dimKey: 'Senior Care' },
  supplements: { emoji: '💊',  label: 'Supplements',     dimKey: 'Supplements' },
  soul:        { emoji: '✨',  label: 'Soul Care',       dimKey: 'Soul Care Products' },
  mira:        { emoji: '🪄',  label: "Mira's Picks",   dimKey: null },
};

// ─── Mira QUOTES per dimension ────────────────────────────────────────────────
const MIRA_QUOTES = {
  grooming:    (n, coat) => coat
    ? `I matched everything here to ${n}'s ${coat} coat — gentle formulas that won't irritate.`
    : `I curated these specifically for ${n}'s breed and coat type.`,
  dental:      (n) => `Dental health affects everything — I picked what works best for ${n}'s size and bite.`,
  coat:        (n, coat) => coat
    ? `${n}'s ${coat} coat needs specific nutrition and topical care — these are my top picks.`
    : `Coat care is more than looks — I picked for ${n}'s skin health and shine.`,
  wellness:    (n) => `Regular vet visits and wellness checks keep ${n} thriving. I flagged the essentials.`,
  senior:      (n) => `${n}'s needs change with age. These are gentle, joint-friendly, and vet-approved.`,
  supplements: (n, coat, cond) => cond
    ? `${n}'s health condition makes these supplements especially relevant — I filtered carefully.`
    : `Targeted supplements to support ${n}'s energy, coat, and immunity.`,
  soul:        (n, breed) => breed
    ? `${n}'s ${breed} soul — I pulled everything made just for your breed.`
    : `Every dog has a soul. These are made for ${n}'s personality and spirit.`,
  mira:        (n) => `My top picks for ${n} across all care dimensions — scored and ranked just for them.`,
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
  push(pet?.allergies); push(pet?.allergy1); push(pet?.allergy2);
  push(pet?.health_data?.allergies); push(pet?.health?.allergies);
  push(pet?.doggy_soul_answers?.food_allergies);
  push(pet?.insights?.key_flags?.allergy_list);
  return [...sets];
};

const getCoatType = (pet) => {
  return pet?.coat_type || pet?.coat || pet?.doggy_soul_answers?.coat_type || null;
};

const getHealthCondition = (pet) => {
  const c = pet?.health_data?.chronic_conditions || pet?.health?.conditions || pet?.healthCondition;
  if (!c) return null;
  return Array.isArray(c) ? c[0] : c;
};

const getBreedDisplay = (pet) => {
  const breed = (pet?.breed || '').trim();
  if (!breed) return '';
  return breed.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

// ─── Robust breed matching (handles multi-word breeds) ──────────────────────
const KNOWN_BREEDS = [
  'american bully','beagle','border collie','boxer','cavalier','chihuahua',
  'chow chow','cocker spaniel','dachshund','dalmatian','doberman',
  'english bulldog','french bulldog','german shepherd','golden retriever',
  'great dane','husky','indie','irish setter','italian greyhound',
  'jack russell','labrador','lhasa apso','maltese','pomeranian',
  'poodle','pug','rottweiler','schnoodle','scottish terrier',
  'shih tzu','st bernard','saint bernard','yorkshire',
  // Extended — breeds with grooming kits in DB
  'akita','australian shepherd','corgi','samoyed','spitz',
  'bernese mountain dog','bulldog','shiba inu','weimaraner',
];

function filterBreedProducts(products, petBreed) {
  const petLower = (petBreed || '').trim().toLowerCase();
  const petWords = petLower.split(/\s+/).filter(w => w.length > 2);
  return products.filter(p => {
    const nameLower = (p.name || '').toLowerCase();
    for (const breed of KNOWN_BREEDS) {
      if (nameLower.includes(breed)) {
        if (!petLower) return false;
        if (nameLower.includes(petLower)) return true;
        if (petWords.some(w => breed.includes(w) || breed.startsWith(w))) return true;
        return false;
      }
    }
    return true;
  });
}

function matchesBreed(productName, breedRaw) {
  if (!breedRaw) return false;
  const nameLower = (productName || '').toLowerCase();
  if (nameLower.includes(breedRaw)) return true;
  return breedRaw.split(/\s+/).filter(w => w.length > 3).some(w => nameLower.includes(w));
}

// ─── Mira Imagines Card for Care ─────────────────────────────────────────────
const MiraCareImaginesCard = ({ item, pet, apiUrl, token }) => {
  const [state, setState] = useState('idle');
  const petName = pet?.name || 'your dog';

  const sendToConcierge = async () => {
    setState('sending');
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      await fetch(`${apiUrl}/api/service_desk/attach_or_create_ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          parent_id: storedUser?.id || storedUser?.email || 'guest',
          pet_id: pet?.id || 'unknown',
          pillar: 'care',
          intent_primary: 'mira_imagines_request',
          intent_secondary: [item.name],
          life_state: 'care',
          channel: 'care_miras_picks_imagines',
          initial_message: {
            sender: 'parent',
            source: 'care_miras_picks',
            text: `I'd love "${item.name}" for ${petName}. Mira imagined this for care — please help source it!`,
          },
        }),
      });
    } catch (err) { console.error('[MiraCareImaginesCard]', err); }
    setState('sent');
  };

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: 'linear-gradient(135deg, #0D2818, #1B4332)',
      border: `1.5px solid rgba(64,145,108,0.30)`,
      display: 'flex', flexDirection: 'column', minHeight: 220,
    }}>
      <div style={{
        position: 'relative', height: 120,
        background: 'linear-gradient(135deg, #1B4332, #2D6A4F)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 44 }}>{item.emoji || '🌿'}</span>
        <div style={{ position: 'absolute', top: 8, left: 8, background: G.sage, color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
          Mira Imagines
        </div>
      </div>
      <div style={{ flex: 1, padding: '10px 12px 4px' }}>
        <p style={{ fontWeight: 800, color: '#fff', fontSize: 12, lineHeight: 1.3, marginBottom: 4 }}>{item.name}</p>
        <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 10, lineHeight: 1.4, margin: 0, fontStyle: 'italic' }}>{item.description}</p>
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        {state === 'sent' ? (
          <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#34D399' }}>
            <Check size={12} style={{ display: 'inline', marginRight: 4 }} /> Sent to Concierge!
          </div>
        ) : (
          <button
            onClick={sendToConcierge}
            disabled={state === 'sending'}
            style={{
              width: '100%', background: `linear-gradient(135deg, ${G.sage}, ${G.deepMid})`,
              color: '#fff', border: 'none', borderRadius: 10, padding: '9px',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              opacity: state === 'sending' ? 0.7 : 1,
            }}
            data-testid={`care-imagine-btn-${item.id}`}
          >
            <Send size={11} />
            {state === 'sending' ? 'Sending…' : 'Tap — Concierge →'}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Generate Mira Imagines for Care ────────────────────────────────────────
const generateCareImagines = (pet, existingProducts) => {
  const petName = pet?.name || 'your dog';
  const breed = getBreedDisplay(pet);
  const coat = getCoatType(pet);
  const condition = getHealthCondition(pet);
  const allergies = getPetAllergies(pet);
  const imagines = [];

  // 1. Breed-specific grooming kit (if breed products don't exist)
  const hasBreedProduct = breed && existingProducts.some(p =>
    matchesBreed(p.name, breed.toLowerCase())
  );
  if (!hasBreedProduct && breed) {
    imagines.push({
      id: `care-imagine-groom-${breed.replace(/\s/g, '-')}`,
      isImagined: true, emoji: '✂️',
      name: `${breed} Grooming Kit`,
      description: `A complete grooming set built for ${breed}'s coat type — brushes, shampoo, ear care, and more.`,
    });
  }

  // 2. Coat-specific treatment
  if (coat) {
    imagines.push({
      id: 'care-imagine-coat',
      isImagined: true, emoji: '🌿',
      name: `${coat.charAt(0).toUpperCase() + coat.slice(1)} Coat Spa Pack`,
      description: `Deep conditioning for ${petName}'s ${coat} coat — a monthly spa box Mira would love to source.`,
    });
  }

  // 3. Health condition care kit
  if (condition && condition.toLowerCase() !== 'none') {
    imagines.push({
      id: 'care-imagine-health',
      isImagined: true, emoji: '💊',
      name: `${petName}'s Recovery Care Kit`,
      description: `Gentle supplements and care products safe for ${petName}'s ${condition} — vet-approved, sourced by Mira.`,
    });
  }

  // 4. Allergy-safe pack
  if (allergies.length > 0) {
    imagines.push({
      id: 'care-imagine-allergy',
      isImagined: true, emoji: '🛡️',
      name: `${allergies.map(a => a.charAt(0).toUpperCase() + a.slice(1) + '-Free').join(' & ')} Care Pack`,
      description: `Every item verified safe for ${petName} — no ${allergies.join(', ')}.`,
    });
  }

  // 5. Fallback — always guarantee at least 2 cards
  if (imagines.length === 0) {
    imagines.push({
      id: 'care-imagine-monthly',
      isImagined: true, emoji: '📦',
      name: `${petName}'s Monthly Care Box`,
      description: `Mira curates grooming, dental, and wellness picks tailored to ${petName}'s needs every month.`,
    });
    imagines.push({
      id: 'care-imagine-soul',
      isImagined: true, emoji: '✨',
      name: `${petName}'s Soul Care Bundle`,
      description: `A personalised soul care collection — capturing ${petName}'s spirit in products Mira imagines for them.`,
    });
  }

  return imagines.slice(0, 3);
};


const CareContentModal = ({ isOpen, onClose, category, pet }) => {
  const [products, setProducts]     = useState([]);
  const [imagines, setImagines]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [activeTab, setActiveTab]   = useState('All');
  const [tabs, setTabs]             = useState(['All']);
  const [isDesktop, setIsDesktop]   = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const { token } = useAuth();

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const config     = CAT_CONFIG[category] || { emoji: '🌿', label: category, dimKey: null };
  const petName    = pet?.name || 'your dog';
  const allergies  = useMemo(() => getPetAllergies(pet), [pet]);
  const coat       = getCoatType(pet);
  const condition  = getHealthCondition(pet);
  const breed      = getBreedDisplay(pet);

  const headerChips = [
    ...allergies.map(a => `${a.charAt(0).toUpperCase() + a.slice(1)}-free`),
    condition ? 'Treatment-safe' : null,
  ].filter(Boolean);

  const miraQuote = MIRA_QUOTES[category]
    ? MIRA_QUOTES[category](petName, coat || breed, condition)
    : null;

  const fetchData = useCallback(async () => {
    if (!isOpen || !category) return;
    setLoading(true);
    setProducts([]);
    setImagines([]);
    setTabs(['All']);
    setActiveTab('All');

    const apiUrl = getApiUrl();

    try {
      // ── Soul Care: breed merch (Breed Collection) + Care Essentials ──────
      if (category === 'soul') {
        const r = await fetch(`${apiUrl}/api/admin/pillar-products?pillar=care&limit=600`);
        const data = r.ok ? await r.json() : { products: [] };
        const allCare = data.products || [];

        const soulProducts = allCare.filter(p => p.dimension === 'Soul Care Products');
        const breedSearch = breed.toLowerCase();

        // Breed Collection: filter to pet's breed only
        const breedProducts = soulProducts.filter(p =>
          p.sub_category === 'Breed Collection'
            ? matchesBreed(p.name, breed.toLowerCase())
            : true  // Keep Care Essentials / other sub-cats for all
        );

        // Build tabs
        const subCats = [...new Set(breedProducts.map(p => p.sub_category).filter(Boolean))];
        setTabs(['All', ...subCats]);
        setProducts(breedProducts);
        return;
      }

      // ── Mira's Picks for care — pre-scored + Imagines ───────────────────
      if (category === 'mira') {
        const petId = pet?.id;
        let preScored = [];
        if (petId) {
          const statusRes = await fetch(`${apiUrl}/api/mira/score-status/${petId}`).catch(() => null);
          if (statusRes?.ok) {
            const status = await statusRes.json();
            if (status.has_scores && status.count > 10) {
              const topRes = await fetch(`${apiUrl}/api/mira/claude-picks/${petId}?pillar=care&limit=24&min_score=40`).catch(() => null);
              if (topRes?.ok) {
                const d = await topRes.json();
                preScored = d.picks || [];
              }
            }
          }
        }
        if (preScored.length > 0) {
          // ✅ PET FIRST: apply breed filter — never show other breed products
          const breedFiltered = filterBreedProducts(preScored, pet?.breed);
          setProducts(breedFiltered);
          // Generate Mira Imagines alongside real products
          const imagines = generateCareImagines(pet, breedFiltered);
          setImagines(imagines);
          return;
        }
        // Fallback: fetch all care products, sort by mira_score, apply breed filter
        const r = await fetch(`${apiUrl}/api/admin/pillar-products?pillar=care&limit=600`);
        const data = r.ok ? await r.json() : { products: [] };
        const all = filterBreedProducts(
          (data.products || []).filter(p => p.mira_score || p.mira_tag),
          pet?.breed
        );
        const sorted = all.sort((a, b) => (b.mira_score || 0) - (a.mira_score || 0)).slice(0, 24);
        setProducts(sorted);
        // Always generate Mira Imagines for care — pet-specific, never empty
        setImagines(generateCareImagines(pet, sorted));
        return;
      }

      // ── Regular dimension ─────────────────────────────────────────────────
      const dimKey = config.dimKey;
      if (!dimKey) { setLoading(false); return; }

      const r = await fetch(`${apiUrl}/api/admin/pillar-products?pillar=care&limit=600`);
      const data = r.ok ? await r.json() : { products: [] };
      // Filter to this dimension, then apply global breed filter
      const dimProds = filterBreedProducts(
        (data.products || []).filter(p => p.dimension === dimKey),
        pet?.breed
      );

      // Allergy filter
      const allergyTerms = allergies.map(a => a.toLowerCase().trim());
      const ALLERGY_CLEAN2 = /^(no|none|none_confirmed|no_allergies)$/i;
      const safe = dimProds.filter(p => {
        if (!allergyTerms.length) return true;
        const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
        const free = (p.allergy_free || '').toLowerCase();
        const isFree = (a) => free.includes(`${a}-free`) || free.includes(`${a} free`) || text.includes(`${a}-free`);
        const hasAllergen = (a) => text.replace(new RegExp(`${a}[- ]free`, 'gi'), '').includes(a);
        return !allergyTerms.some(a => !isFree(a) && hasAllergen(a));
      });

      // Coat / condition sort — breed-specific products float to TOP
      const petBreedLower = (pet?.breed || '').trim().toLowerCase();
      const scored = safe.map(p => {
        const text = `${p.name || ''} ${p.description || ''} ${p.sub_category || ''} ${p.mira_tag || ''}`.toLowerCase();
        const coatMatch = coat && text.includes((coat || '').toLowerCase());
        const healthSafe = condition && (text.includes('treatment') || (p.allergy_free || '').toLowerCase().includes('treatment-safe'));
        // Breed-match: product name contains the pet's breed → highest priority
        const breedMatch = petBreedLower && (p.name || '').toLowerCase().includes(petBreedLower);
        return { ...p, _coatMatch: coatMatch, _healthSafe: healthSafe, _breedMatch: breedMatch };
      }).sort((a, b) => {
        if (a._breedMatch && !b._breedMatch) return -1;
        if (!a._breedMatch && b._breedMatch) return 1;
        if (a._coatMatch && !b._coatMatch) return -1;
        if (!a._coatMatch && b._coatMatch) return 1;
        if (a._healthSafe && !b._healthSafe) return -1;
        if (!a._healthSafe && b._healthSafe) return 1;
        return 0;
      });

      // Build tabs from sub_category
      const subCats = [...new Set(dimProds.map(p => p.sub_category).filter(Boolean))];
      setTabs(['All', ...subCats]);
      setProducts(scored);
    } catch (err) {
      console.error('[CareContentModal]', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, category, pet, allergies, coat, condition, breed, config.dimKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Tab filtering
  const displayed = activeTab === 'All'
    ? products
    : products.filter(p => p.sub_category === activeTab);

  if (!isOpen) return null;

  const modalStyle = isDesktop ? {
    position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  } : {
    position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'flex-end',
  };

  const panelStyle = isDesktop ? {
    background: '#fff', borderRadius: 20, width: '100%', maxWidth: 860,
    maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    position: 'relative',
  } : {
    background: '#fff', borderRadius: '20px 20px 0 0', width: '100%',
    maxHeight: '92vh', overflowY: 'auto',
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 8999 }}
          />
          {/* Panel */}
          <div style={modalStyle}>
            <motion.div
              initial={isDesktop ? { opacity: 0, scale: 0.96 } : { y: '100%' }}
              animate={isDesktop ? { opacity: 1, scale: 1 } : { y: 0 }}
              exit={isDesktop ? { opacity: 0, scale: 0.96 } : { y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={panelStyle}
            >
              {/* Header */}
              <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${G.pale}`, position: 'sticky', top: 0, background: '#fff', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 24 }}>{config.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: G.darkText }}>{config.label}</div>
                    {headerChips.length > 0 && (
                      <div style={{ fontSize: 11, color: G.mutedText }}>
                        {headerChips.join(' · ')}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    style={{ background: G.cream, border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: G.sage, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    data-testid="care-modal-close"
                  >
                    Close <X size={12} />
                  </button>
                </div>

                {/* Mira quote */}
                {miraQuote && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: G.cream, border: `1px solid ${G.border}`, borderRadius: 10, padding: '10px 14px', marginTop: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg,${G.sage},${G.deepMid})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0 }}>✦</div>
                    <div>
                      <p style={{ fontSize: 12, color: G.darkText, fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>"{miraQuote}"</p>
                      <span style={{ fontSize: 10, color: G.sage, fontWeight: 600 }}>♥ Mira knows {petName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: '14px 20px 24px' }}>
                {/* Tabs */}
                {tabs.length > 1 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {tabs.map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                          padding: '5px 14px', borderRadius: 20,
                          border: `1.5px solid ${activeTab === tab ? G.sage : G.border}`,
                          background: activeTab === tab ? G.sage : '#fff',
                          color: activeTab === tab ? '#fff' : G.mutedText,
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                        data-testid={`care-modal-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                )}

                {/* Stats */}
                {products.length > 0 && !loading && (
                  <div style={{ fontSize: 11, color: G.mutedText, marginBottom: 12, fontWeight: 600 }}>
                    ✦ {displayed.length} {config.label} — for {petName}
                  </div>
                )}

                {/* Product grid */}
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: G.mutedText }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🌿</div>
                    Loading {config.label} for {petName}…
                  </div>
                ) : displayed.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>
                      {category === 'soul' ? '✨' : '🌿'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {category === 'soul' && !breed
                        ? 'Breed not set — add your dog\'s breed to see personalised soul items'
                        : `No ${config.label} products available right now`}
                    </div>
                    <div style={{ fontSize: 12, color: G.mutedText }}>
                      {category === 'soul' && breed && `Looking for items made for ${breed}s`}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(190px,100%), 1fr))', gap: 12 }}>
                    {displayed.map(p => (
                      <div key={p.id || p._id} data-testid={`care-modal-product-${p.id}`}>
                        <ProductCard product={p} pillar="care" selectedPet={pet} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Mira Imagines — always show for Mira's Picks, even when no products */}
                {category === 'mira' && !loading && (imagines.length > 0 || displayed.length === 0) && (
                  <>
                    <div style={{ marginTop: 24, marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: G.darkText, fontFamily: 'Georgia, serif', marginBottom: 4 }}>
                        Mira Imagines for <span style={{ color: G.sage }}>{petName}</span>
                      </div>
                      <div style={{ fontSize: 11, color: G.mutedText }}>
                        Based on {petName}'s soul profile — not in range yet, but Mira can request these specially.
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(190px,100%), 1fr))', gap: 12 }}>
                      {imagines.map(item => (
                        <MiraCareImaginesCard
                          key={item.id}
                          item={item}
                          pet={pet}
                          apiUrl={getApiUrl()}
                          token={token}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CareContentModal;
