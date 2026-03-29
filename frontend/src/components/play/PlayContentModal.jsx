/**
 * PlayContentModal.jsx — /play pillar
 * Mirrors DineContentModal exactly — opens when a category strip pill is clicked.
 * Breed-specific soul picks + AI Mira's Picks + sub-category tabs + product grid.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, Send, Star } from 'lucide-react';
import { toast } from 'sonner';
import SharedProductCard from '../ProductCard';
import FlatArtPickerCard from '../common/FlatArtPickerCard';
import SoulMadeModal from '../SoulMadeModal';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../utils/api';
import { bookViaConcierge } from '../../utils/MiraCardActions';
import BuddyMeetup from './BuddyMeetup';
import { useConcierge } from '../../hooks/useConcierge';
import { tdc } from '../../utils/tdc_intent';
import { buildPaths, PathFlowModal } from './GuidedPlayPaths';
import PersonalisedBreedSection from '../common/PersonalisedBreedSection';
import { MiraPicksSection } from '../../pages/PlaySoulPage';

const getApiUrl = () => API_URL;

// ── Pet helpers ───────────────────────────────────────────────────────────────
const ALLERGY_CLEAN = /^(no|none|none_confirmed|no_allergies|no allergies|na|n\/a|unknown)$/i;
const getAllergies = (pet) => {
  const s = new Set();
  const push = (v) => {
    if (!v) return;
    (Array.isArray(v) ? v : v.split(/,|;/).map(x => x.trim())).forEach(a => {
      if (a && !ALLERGY_CLEAN.test(a.trim())) s.add(a.toLowerCase());
    });
  };
  push(pet?.allergies); push(pet?.allergy1); push(pet?.allergy2);
  push(pet?.health_data?.allergies); push(pet?.health?.allergies);
  push(pet?.doggy_soul_answers?.food_allergies);
  return [...s];
};

// ── Category config ────────────────────────────────────────────────────────────
const fmtTab = (t) => t === 'All' || t === 'all' ? t : t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const CATEGORY_CONFIG = {
  'outings':     { emoji:'🌳', label:'Outings & Parks',   apiCategory:'outings'   },
  'playdates':   { emoji:'🐾', label:'Playdates',          apiCategory:'playdates' },
  'walking':     { emoji:'🦮', label:'Dog Walking',        apiCategory:'walking'   },
  'fitness':     { emoji:'💪', label:'Fitness & Training', apiCategory:'fitness'   },
  'swimming':    { emoji:'🏊', label:'Swimming',           apiCategory:'swimming'  },
  'soul':        { emoji:'✨', label:'Soul Play',          apiCategory:null        },
  'bundles':     { emoji:'🎁', label:'Play Bundles',       apiCategory:null        },
  'miras-picks': { emoji:'💫', label:"Mira's Picks",       apiCategory:null        },
  'soul_made':   { emoji:'✦',  label:'Soul Made™',         apiCategory:null        },
};

// ── Mira quote builder ────────────────────────────────────────────────────────
const buildMiraQuote = (pet, category) => {
  const name = pet?.name || 'your dog';
  const breed = pet?.breed || null;
  const energy = pet?.energy_level || null;
  const QUOTES = {
    outings:     breed ? `${name}'s ${breed} spirit thrives outdoors. I picked everything for a perfect park day.` : `Everything here is built for ${name}'s outdoor adventures.`,
    playdates:   `${name} deserves the best playdates. I matched these to ${name}'s social energy and size.`,
    walking:     breed ? `${breed}s need the right walk kit. Everything here is matched to ${name}'s gait and pace.` : `Walk essentials matched to ${name}'s routine and energy.`,
    fitness:     energy ? `${name}'s energy level: ${energy}. I picked fitness tools that channel it right.` : `Fitness tools matched to ${name}'s body, breed, and energy.`,
    swimming:    `${name} and water — I built this list around safety, fun, and ${breed || 'their'} swimming ability.`,
    soul:        breed ? `${name} is a ${breed}. These are the Soul Play items made specifically for ${name}.` : `Every piece in Soul Play is made for ${name} — personalised, not generic.`,
    'miras-picks': `These are my top picks across all of ${name}'s play profile — energy, breed, and lifestyle matched.`,
  };
  return QUOTES[category] || `Personalised for ${name}.`;
};

// ── Mira Imagines card (items not yet in catalog) ─────────────────────────────
const MiraImaginesCard = ({ item, pet, token }) => {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const petName = pet?.name || 'your dog';

  const handleSource = async () => {
    if (sending || sent) return;
    setSending(true);
    tdc.imagine({ name: item.name, pillar: 'play', pet, channel: 'play_content_modal_imagine' });
    await bookViaConcierge({
      service: item.name,
      pillar: 'play',
      pet,
      token,
      channel: 'play_content_modal_imagine',
      onSuccess: () => setSent(true),
    });
    setSending(false);
  };

  return (
    <div style={{ borderRadius:14, overflow:'hidden', background:'linear-gradient(135deg,#1A0A00,#2D1A00)', border:'1.5px solid rgba(255,140,66,0.25)', display:'flex', flexDirection:'column', minHeight:200 }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'18px 14px 6px' }}>
        <span style={{ fontSize:34 }}>{item.emoji}</span>
        <div style={{ margin:'6px 0 0', background:'rgba(255,140,66,0.2)', border:'1px solid rgba(255,140,66,0.4)', borderRadius:20, padding:'2px 10px', fontSize:9, color:'#FFC080', fontWeight:700, letterSpacing:'0.05em' }}>MIRA IMAGINES</div>
        <p style={{ fontWeight:800, color:'#fff', textAlign:'center', fontSize:12, marginTop:8, lineHeight:1.3 }}>{item.name}</p>
        <p style={{ color:'rgba(255,255,255,0.50)', fontSize:10, textAlign:'center', marginTop:4, lineHeight:1.5 }}>{item.description}</p>
      </div>
      <div style={{ padding:'0 12px 14px' }}>
        {sent ? (
          <div style={{ textAlign:'center', fontSize:11, fontWeight:700, color:'#32C878' }}><Check size={12} style={{ display:'inline', marginRight:4 }} /> Sent to Concierge®!</div>
        ) : (
          <button onClick={handleSource} disabled={sending} style={{ width:'100%', background:'linear-gradient(135deg,#FF8C42,#C44400)', color:'#fff', border:'none', borderRadius:10, padding:'9px', fontSize:11, fontWeight:700, cursor:'pointer', opacity: sending ? 0.7 : 1 }}>
            {sending ? 'Sending…' : 'Request a Quote →'}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Generate Mira Imagines for play ───────────────────────────────────────────
const generatePlayImagines = (pet, existingProducts) => {
  const petName = pet?.name || 'your dog';
  const breed   = (pet?.breed || '').trim();
  const imagines = [];

  const hasBreedProduct = breed && existingProducts.some(p => (p.name||'').toLowerCase().includes(breed.toLowerCase()));
  if (!hasBreedProduct) {
    imagines.push({ id:`imagine-play-${breed||'custom'}`, isImagined:true, emoji:'🎯', name: breed ? `${breed} Play Pack` : `${petName}'s Play Pack`, description: breed ? `A curated play bundle built around what ${breed}s love most.` : `A personalised play kit built around ${petName}'s energy and style.` });
  }

  imagines.push({ id:'imagine-fitness-plan', isImagined:true, emoji:'💪', name:`${petName}'s 4-Week Fitness Plan`, description:`Mira builds a breed-specific training plan — agility, strength, and endurance sessions.` });
  imagines.push({ id:'imagine-park-pass', isImagined:true, emoji:'🌳', name:`Monthly Park Pass for ${petName}`, description:`Unlimited access to premium dog parks near you — curated by Mira for ${petName}'s location.` });

  return imagines.slice(0, 4);
};

// ── Bundle Card component ─────────────────────────────────────────────────────
const BundleCard = ({ bundle, petName, pet, token }) => {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const img = bundle.image_url || bundle.watercolor_image || bundle.cloudinary_image_url;
  const savings = bundle.original_price && bundle.bundle_price
    ? Math.round(((bundle.original_price - bundle.bundle_price) / bundle.original_price) * 100)
    : 0;

  const handleGet = async () => {
    if (sending || sent) return;
    setSending(true);
    await bookViaConcierge({
      service: bundle.name,
      pillar: 'play',
      pet,
      token,
      channel: 'play_bundle_card',
      amount: bundle.bundle_price,
      onSuccess: () => setSent(true),
    });
    setSending(false);
  };
  return (
    <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', border:'1.5px solid rgba(231,111,81,0.15)', boxShadow:'0 2px 12px rgba(123,45,0,0.07)' }}>
      <div style={{ height:160, background:'linear-gradient(135deg,#FFF8F0,#FFE8D4)', position:'relative', overflow:'hidden' }}>
        {img
          ? <img src={img} alt={bundle.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none';}} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48 }}>{bundle.icon || '🎁'}</div>
        }
        {savings > 0 && (
          <div style={{ position:'absolute', top:10, right:10, background:'#C44400', color:'#fff', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:800 }}>
            Save {savings}%
          </div>
        )}
        {bundle.popular && (
          <div style={{ position:'absolute', top:10, left:10, background:'linear-gradient(135deg,#E76F51,#C44400)', color:'#fff', borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:700 }}>
            ★ Popular
          </div>
        )}
      </div>
      <div style={{ padding:'14px 16px 16px' }}>
        <h4 style={{ fontSize:14, fontWeight:800, color:'#7B2D00', marginBottom:6, lineHeight:1.3 }}>{bundle.name}</h4>
        {bundle.description && (
          <p style={{ fontSize:12, color:'#666', lineHeight:1.5, marginBottom:10, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{bundle.description}</p>
        )}
        {bundle.items && (
          <p style={{ fontSize:11, color:'#888', marginBottom:10, fontStyle:'italic' }}>Includes: {typeof bundle.items === 'string' ? bundle.items.slice(0,80) : bundle.items.slice?.(0,3).join(', ')}</p>
        )}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          {bundle.bundle_price && (
            <span style={{ fontSize:16, fontWeight:900, color:'#7B2D00' }}>₹{Number(bundle.bundle_price).toLocaleString('en-IN')}</span>
          )}
          {bundle.original_price && bundle.bundle_price && Number(bundle.original_price) > Number(bundle.bundle_price) && (
            <span style={{ fontSize:12, color:'#aaa', textDecoration:'line-through' }}>₹{Number(bundle.original_price).toLocaleString('en-IN')}</span>
          )}
        </div>
        {sent
          ? <div style={{ textAlign:'center', fontSize:12, fontWeight:700, color:'#C44400', padding:'8px 0' }}>✓ Request sent to Concierge®!</div>
          : <button onClick={handleGet} disabled={sending} style={{ width:'100%', background:'linear-gradient(135deg,#E76F51,#C44400)', color:'#fff', border:'none', borderRadius:10, padding:'9px 0', fontSize:12, fontWeight:700, cursor: sending ? 'wait' : 'pointer', opacity: sending ? 0.7 : 1 }}>
              {sending ? 'Sending…' : `Get ${petName ? `for ${petName}` : 'this bundle'} →`}
            </button>
        }
      </div>
    </div>
  );
};

// ── Main Modal ────────────────────────────────────────────────────────────────
const PlayContentModal = ({ isOpen, onClose, category, pet, onNavigateToNearMe }) => {
  const [products, setProducts] = useState([]);
  const [flatArtProducts, setFlatArtProducts] = useState([]);
  const [yappyIllustrations, setYappyIllustrations] = useState([]);
  const [artStyle, setArtStyle] = useState('watercolour');
  const [imagines, setImagines] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [dimTab,    setDimTab]    = useState('products');
  const [tabs,      setTabs]     = useState([]);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [soulMadeOpen, setSoulMadeOpen] = useState(false);
  const [guidedPath, setGuidedPath] = useState(null);
  const { token } = useAuth();
  const { fire: fireConcierge } = useConcierge({ pet, pillar: 'play' });

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const config   = CATEGORY_CONFIG[category] || { emoji:'🎾', label:category, apiCategory:null };
  const petName  = pet?.name  || 'your dog';
  const petBreed = (pet?.breed || '').toLowerCase().trim();
  const allergies = useMemo(() => getAllergies(pet), [pet]);
  const miraQuote = buildMiraQuote(pet, category);

  const fetchData = useCallback(async () => {
    if (!isOpen || !category) return;
    setLoading(true);
    setProducts([]);
    setFlatArtProducts([]);
    setYappyIllustrations([]);
    setImagines([]);
    setTabs([]);
    setActiveTab('all');
    setArtStyle('watercolour');

    const apiUrl = getApiUrl();

    try {
      // ── Soul Made™: breed-specific products ──────
      if (category === 'soul_made') {
        const breedParam = encodeURIComponent(petBreed);
        const [r1, r2, r3] = await Promise.all([
          fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedParam}&pillar=play&limit=60`),
          fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedParam}&flat_only=true&limit=60`),
          fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedParam}&product_type=birthday_cake&limit=10`),
        ]);
        const data1 = r1.ok ? await r1.json() : { products: [] };
        const bp = (data1.products || []).filter(p =>
          p.product_type !== 'birthday_cake' && p.product_type !== 'Birthday Cake'
        );
        const subCats = [...new Set(bp.map(p => p.sub_category || p.product_type).filter(Boolean))];
        setTabs(subCats.length > 0 ? subCats : []);
        setProducts(bp);
        const data2 = r2.ok ? await r2.json() : { products: [] };
        setFlatArtProducts(data2.products || []);
        const data3 = r3.ok ? await r3.json() : { products: [] };
        setYappyIllustrations(data3.products || []);
        setLoading(false);
        return;
      }

      // ── Soul Play — breed-specific products across all play-relevant types ──
      if (category === 'soul') {
        const breedParam = encodeURIComponent(petBreed);
        const SOUL_PLAY_TYPES = new Set([
          'play_bandana', 'playdate_card', 'id_tag', 'tote_bag', 'keychain',
          'training_kit', 'rope_toy', 'fetch_toy_set', 'walking_set', 'treat_pouch',
        ]);
        const [r1, r2] = await Promise.all([
          fetch(`${apiUrl}/api/mockups/breed-products?breed=${breedParam}&limit=80`).then(r=>r.ok?r.json():{products:[]}).catch(()=>({products:[]})),
          fetch(`${apiUrl}/api/admin/pillar-products?pillar=play&category=soul&limit=30`).then(r=>r.ok?r.json():{products:[]}).catch(()=>({products:[]})),
        ]);
        const breedProds = (r1.products || []).filter(p => SOUL_PLAY_TYPES.has(p.product_type));
        const pillarProds = r2.products || [];
        const all = [...breedProds, ...pillarProds];
        // Deduplicate by name
        const seen = new Map();
        all.forEach(p => { const k=(p.name||'').toLowerCase().trim(); if(!seen.has(k)) seen.set(k,p); });
        const deduped = [...seen.values()];
        setProducts(deduped);
        setImagines(deduped.length > 0 ? generatePlayImagines(pet, deduped) : generatePlayImagines(pet, []));
        return;
      }

      // ── Mira's Picks — AI-scored, breed + allergen filtered ──────────────────
      if (category === 'miras-picks') {
        const petId = pet?.id;
        let preScored = [];
        if (petId) {
          const statusRes = await fetch(`${apiUrl}/api/mira/score-status/${petId}`).catch(()=>null);
          if (statusRes?.ok) {
            const status = await statusRes.json();
            if (status.has_scores && status.count > 5) {
              const topRes = await fetch(`${apiUrl}/api/mira/claude-picks/${petId}?pillar=play&limit=24&min_score=40`).catch(()=>null);
              if (topRes?.ok) { const d = await topRes.json(); preScored = d.picks||[]; }
            }
          }
        }
        // Fetch all play categories in parallel
        const PLAY_CATS = ['outings','playdates','walking','fitness','swimming','soul'];
        const results = await Promise.all(
          PLAY_CATS.map(cat => fetch(`${apiUrl}/api/admin/pillar-products?pillar=play&category=${cat}&limit=40`).then(r=>r.ok?r.json():{products:[]}).catch(()=>({products:[]})))
        );
        const allByName = new Map();
        results.forEach(d => (d.products||[]).forEach(p => { const k=(p.name||p.id||'').toLowerCase(); if(!allByName.has(k)) allByName.set(k,p); }));
        const allRaw = [...allByName.values()];

        // Breed-filter soul items, keep all_breeds for rest; check breed_targets first
        const filtered = allRaw.filter(p => {
          const bt  = (p.breed_tags||[]).map(b=>b.toLowerCase());
          const btr = (p.breed_targets||[]).map(b=>b.toLowerCase());
          const isAll = bt.includes('all_breeds') || bt.includes('all') || (bt.length===0 && btr.length===0);
          if (isAll) return true;
          if (!petBreed) return true;
          if (btr.length > 0) return btr.some(b => petBreed.includes(b) || b.includes(petBreed));
          return bt.includes(petBreed);
        });

        // Allergen filter
        const safe = filtered.filter(p => {
          if (!allergies.length) return true;
          const text = `${p.name} ${p.description||''}`.toLowerCase();
          return !allergies.some(a => text.includes(a) && !text.includes(`${a}-free`));
        });

        // Merge with pre-scored AI picks
        const scoreById = {};
        preScored.forEach(p => { scoreById[p.id]=p; });
        const enriched = safe.map(p => ({ ...p, mira_score: scoreById[p.id]?.mira_score||p.mira_score, mira_hint: scoreById[p.id]?.mira_reason||p.mira_hint||null }));
        const sorted = preScored.length > 0
          ? [...enriched].sort((a,b)=>(b.mira_score||0)-(a.mira_score||0))
          : enriched;

        setProducts(sorted.slice(0, 24));
        setImagines(generatePlayImagines(pet, sorted));

        if (petId && preScored.length===0) {
          if (!pet?.overall_score || pet.overall_score <= 0) { fetch(`${apiUrl}/api/mira/score-for-pet`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pet_id:petId, pillar:'play'}) }).catch(()=>{}); }
        }
        return;
      }

      // ── Bundles — fetch from enjoy + fit pillars in bundles collection ─────
      if (category === 'bundles') {
        const [enjoyRes, fitRes] = await Promise.all([
          fetch(`${apiUrl}/api/bundles?pillar=enjoy&active_only=true&limit=20`).then(r=>r.ok?r.json():{bundles:[]}).catch(()=>({bundles:[]})),
          fetch(`${apiUrl}/api/bundles?pillar=fit&active_only=true&limit=20`).then(r=>r.ok?r.json():{bundles:[]}).catch(()=>({bundles:[]})),
        ]);
        const allBundles = [...(enjoyRes.bundles||[]), ...(fitRes.bundles||[])];
        // Convert bundle schema to product-compatible schema for rendering
        const normalized = allBundles.map(b => ({
          ...b,
          entity_type: 'bundle',
          image_url: b.image_url || b.watercolor_image || b.cloudinary_image_url || null,
          price: b.bundle_price || b.price,
          original_price: b.original_price,
          description: b.description,
          mira_hint: b.popular ? 'Popular bundle — great value' : null,
        }));
        setProducts(normalized);
        setImagines([]);
        return;
      }

      // ── Standard category (outings, playdates, walking, fitness, swimming) ───
      if (config.apiCategory) {
        // Also fetch toys for outings (they map to outings dim)
        const requests = [fetch(`${apiUrl}/api/admin/pillar-products?pillar=play&category=${config.apiCategory}&limit=60`)];
        if (category === 'outings') requests.push(fetch(`${apiUrl}/api/admin/pillar-products?pillar=play&category=toys&limit=40`));
        if (category === 'fitness') requests.push(fetch(`${apiUrl}/api/admin/pillar-products?pillar=play&category=fit&limit=30`));

        const results = await Promise.all(requests.map(r => r.then(res=>res.ok?res.json():{products:[]}).catch(()=>({products:[]}))));
        const allByName = new Map();
        results.forEach(d => (d.products||[]).forEach(p => { const k=(p.name||'').toLowerCase(); if(!allByName.has(k)) allByName.set(k,p); }));
        const prods = [...allByName.values()];

        // Breed filter — show all_breeds + empty + this breed
        const filtered = prods.filter(p => {
          const bt = (p.breed_tags||[]).map(b=>b.toLowerCase());
          if (bt.length===0) return true;
          if (bt.includes('all_breeds') || bt.includes('all')) return true;
          return petBreed ? bt.includes(petBreed) : true;
        });

        // Build sub-category tabs — filter out other breed tabs (only show pet's own breed)
        const breedSlug = petBreed ? petBreed.replace(/\s+/g, '_') : '';
        const uniqueTabs = [...new Set(filtered.map(p=>p.sub_category).filter(Boolean))].filter(tab => {
          // If tab contains a breed suffix like "-play", "-shop", check it belongs to this pet
          if (/-play$|-shop$/.test(tab)) {
            return !breedSlug || tab.toLowerCase().startsWith(breedSlug);
          }
          return true; // generic tabs always show
        });
        setTabs(uniqueTabs);
        setProducts(filtered);
      }
    } catch(err) {
      console.error('[PlayContentModal]', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, category, pet, petBreed]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredProducts = activeTab === 'all'
    ? products
    : products.filter(p => p.sub_category === activeTab || p.category === activeTab || p.product_type === activeTab);

  if (!isOpen) return null;

  const G = { orange:'#E76F51', mid:'#7B3F00', deep:'#7B2D00', pale:'#FFF0EA', cream:'#FFF8F5' };

  const ModalContent = (
    <motion.div
      initial={{ opacity:0, y:isDesktop ? 0 : 60, scale:isDesktop ? 0.97 : 1 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:isDesktop ? 0 : 60, scale:isDesktop ? 0.97 : 1 }}
      transition={{ type:'spring', damping:28, stiffness:320 }}
      style={isDesktop ? {
        width:'92vw', maxWidth:1140, maxHeight:'90vh',
        borderRadius:20, display:'flex', flexDirection:'column',
        background:'#fff', boxShadow:'0 24px 64px rgba(0,0,0,0.20)',
        overflow:'hidden',
      } : {
        position:'fixed', left:0, right:0, bottom:0,
        maxHeight:'93vh', borderTopLeftRadius:24, borderTopRightRadius:24,
        display:'flex', flexDirection:'column', zIndex:56, background:'#fff',
      }}
      data-testid={`play-modal-${category}`}
    >
      {/* Drag handle (mobile) */}
      {!isDesktop && (
        <div style={{ display:'flex', justifyContent:'center', paddingTop:10, flexShrink:0 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:'#e0e0e0' }} />
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #F0E8E0', flexShrink:0 }}>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
          <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background:`linear-gradient(135deg,${G.pale},#FFE0B2)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
            {config.emoji}
          </div>
          <div>
            <h2 style={{ fontWeight:900, fontSize:18, color:G.deep, margin:0 }}>{config.label}</h2>
            <p style={{ margin:'3px 0 0', fontSize:12, color:'#888' }}>Personalised for {petName}</p>
          </div>
        </div>
        <button onClick={onClose} style={{ display:'flex', alignItems:'center', gap:6, background:G.pale, color:'#C44400', border:'none', borderRadius:20, padding:'7px 14px', fontSize:12, fontWeight:700, cursor:'pointer', flexShrink:0 }} data-testid="play-modal-close">
          Close <X size={13} />
        </button>
      </div>

      {/* ── Mira Quote ──────────────────────────────────────────────────────── */}
      <div style={{ margin:'12px 16px 0', background:'linear-gradient(90deg,#FFF8F0,#FFF3E8)', border:'1px solid #FFE0C0', borderRadius:14, padding:'12px 14px', display:'flex', gap:12, alignItems:'flex-start', flexShrink:0 }}>
        <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#FF8C42,#C44400)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>✦</div>
        <div>
          <p style={{ fontSize:13, color:'#4A2000', fontStyle:'italic', margin:0, lineHeight:1.5 }}>"{miraQuote}"</p>
          <p style={{ fontSize:11, color:'#C44400', fontWeight:700, margin:'5px 0 0' }}>♥ Mira knows {petName}</p>
        </div>
      </div>

      {/* ── Products / Personalised toggle ── */}
      {!['bundles','soul','miras-picks'].includes(category) && (
        <div style={{ display:'flex', borderBottom:'1px solid #F0E8E0', flexShrink:0 }}>
          {[['products','🎯 Products'],['personalised','✦ Personalised']].map(([tid,label]) => (
            <button key={tid} onClick={() => setDimTab(tid)}
              style={{ flex:1, padding:'10px 0', background:'none', border:'none',
                borderBottom:dimTab===tid?`2.5px solid ${G.orange}`:'2.5px solid transparent',
                color:dimTab===tid?G.mid:'#888', fontSize:12,
                fontWeight:dimTab===tid?700:400, cursor:'pointer' }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {dimTab === 'personalised' && !['bundles','soul','miras-picks'].includes(category) ? (
        <div style={{ padding:'16px', flex:1, overflowY:'auto' }}>
          <PersonalisedBreedSection pet={pet} pillar="play" />
        </div>
      ) : category === 'miras-picks' ? (
        <div style={{ padding:'16px', flex:1, overflowY:'auto' }}>
          <MiraPicksSection pet={pet} />
        </div>
      ) : (<>

      {/* ── Sub-category tabs ────────────────────────────────────────────────── */}
      {tabs.length > 1 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', padding:'12px 16px 4px', flexShrink:0, scrollbarWidth:'none' }}>
          {['all', ...tabs].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flexShrink:0, borderRadius:20, padding:'6px 16px', fontSize:12.5, fontWeight:700, border: activeTab===tab ? 'none' : `1.5px solid #FFCC99`, background: activeTab===tab ? `linear-gradient(135deg,${G.orange},#C44400)` : G.pale, color: activeTab===tab ? '#fff' : '#C44400', cursor:'pointer' }} data-testid={`play-tab-${tab}`}>
              {fmtTab(tab)}
            </button>
          ))}
        </div>
      )}

      {/* ── Product Grid ─────────────────────────────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'64px 0' }}>
            <Loader2 style={{ width:28, height:28, color:G.orange, animation:'spin 1s linear infinite' }} />
            <span style={{ marginLeft:12, color:'#888', fontSize:14 }}>Finding the best for {petName}…</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <div style={{ padding:'16px 16px 80px' }}>
            {/* Product count */}
            {(filteredProducts.length > 0 || imagines.length > 0) && (
              <p style={{ fontSize:11, fontWeight:700, color:G.orange, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:14 }}>
                ✦ {filteredProducts.length} {config.label}{imagines.length>0?` + ${imagines.length} Mira Imagines`:''} — For {petName}
              </p>
            )}

            {/* Mira Imagines */}
            {imagines.length > 0 && (
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:11, fontWeight:700, color:'rgba(255,140,66,0.85)', marginBottom:10, letterSpacing:'0.04em' }}>✦ MIRA IMAGINES — NOT YET IN CATALOG</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(200px,100%),1fr))', gap:14 }}>
                  {imagines.map(item => <MiraImaginesCard key={item.id} item={item} pet={pet} token={token} />)}
                </div>
              </div>
            )}

            {/* Art style toggle — soul_made only */}
            {category === 'soul_made' && filteredProducts.length > 0 && yappyIllustrations.length > 0 && (
              <div style={{ display:'flex', background:'#F0EBF8', borderRadius:999, padding:3, marginBottom:16, gap:2, width:'fit-content' }}>
                {['watercolour','flat_art'].map(s => (
                  <button key={s} onClick={() => setArtStyle(s)} style={{
                    padding:'5px 14px', borderRadius:999, border:'none',
                    background: artStyle===s ? '#8B5CF6' : 'transparent',
                    color: artStyle===s ? '#fff' : 'rgba(0,0,0,0.45)',
                    fontSize:11, fontWeight:700, cursor:'pointer', transition:'all 0.15s',
                  }}>
                    {s==='watercolour' ? '🎨 Watercolour' : '🐾 Flat Art'}
                  </button>
                ))}
              </div>
            )}

            {/* Products / Bundles */}
            {filteredProducts.length > 0 ? (
              category === 'soul_made' && artStyle === 'flat_art' ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(200px,100%),1fr))', gap:16 }}>
                  {filteredProducts.map((p,i) => (
                    <FlatArtPickerCard key={p.id||p.name||i} product={p} illustrations={yappyIllustrations} pet={pet} pillar="play" />
                  ))}
                </div>
              ) : category === 'bundles' ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(240px,100%),1fr))', gap:20 }}>
                  {filteredProducts.map((b,i) => (
                    <BundleCard key={b.id||b._id||i} bundle={b} petName={petName} pet={pet} token={token} />
                  ))}
                </div>
              ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(220px,100%),1fr))', gap:16 }}>
                {filteredProducts.map((p,i) => (
                  <div key={p.id||p._id||i} style={{ position:'relative' }}>
                    {p.mira_score >= 75 && (
                      <div style={{ position:'absolute', top:-6, right:-6, zIndex:2, background:G.mid, borderRadius:20, padding:'1px 7px', fontSize:9, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:3 }}>
                        <Star size={8} />★ {p.mira_score}
                      </div>
                    )}
                    <SharedProductCard product={p} pillar="play" selectedPet={pet} />
                  </div>
                ))}
              </div>
              )
            ) : (
              !loading && imagines.length===0 && (
                <div style={{ textAlign:'center', padding:'48px 0' }}>
                  <p style={{ fontSize:36 }}>{config.emoji}</p>
                  <p style={{ fontSize:14, color:'#888', marginTop:8 }}>Personalised picks for {petName} coming soon!</p>
                </div>
              )
            )}

            {/* ── Soul Made trigger — soul_made category ───────────────── */}
            {category === 'soul_made' && !loading && (
              <div style={{ marginTop:20 }}>
                <div
                  data-testid="soul-made-trigger"
                  onClick={() => setSoulMadeOpen(true)}
                  style={{
                    padding:'20px 20px 18px',
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
            {/* ── Soul Made cross-sell — ALL other categories ───────────── */}
            {category !== 'soul_made' && (
              <div style={{ marginTop:20 }}>
                <div
                  data-testid="soul-made-cross-sell"
                  onClick={() => setSoulMadeOpen(true)}
                  style={{
                    padding:'20px 20px 18px',
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
          </div>
        )}
      </div>
      </>)}

      {soulMadeOpen && <SoulMadeModal pet={pet} pillar="play" pillarColor={G.orange} pillarLabel="Play" onClose={() => setSoulMadeOpen(false)} />}

      {/* ── Guided Path Flow Modal (for outings → Park Routine, playdates → Playdate Starter) ─ */}
      {guidedPath && <PathFlowModal path={guidedPath} pet={pet} onClose={() => setGuidedPath(null)} />}

      {/* ── Footer — category-specific CTAs ──────────────────────────── */}
      {/* Hide footer for: bundles, soul, miras-picks */}
      {!['bundles', 'soul', 'miras-picks'].includes(category) && (
        <div style={{ flexShrink:0, padding:'14px 20px', borderTop:'1px solid #F0E8E0', background:'#FFFAF6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ fontSize:12, color:'#888', margin:0 }}>Personalised for {petName}</p>
          <button
            onClick={() => {
              const paths = buildPaths(pet);
              if (category === 'soul_made') {
                setSoulMadeOpen(true);
              } else if (category === 'outings') {
                const p = paths.find(p => p.id === 'park_routine');
                if (p) setGuidedPath(p);
              } else if (category === 'playdates') {
                const p = paths.find(p => p.id === 'playdate_starter');
                if (p) setGuidedPath(p);
              } else if (category === 'walking') {
                const p = paths.find(p => p.id === 'walk_essentials');
                if (p) setGuidedPath(p);
              } else if (category === 'fitness') {
                const p = paths.find(p => p.id === 'fitness_reboot');
                if (p) setGuidedPath(p);
              } else if (category === 'swimming') {
                const p = paths.find(p => p.id === 'swim_confidence');
                if (p) setGuidedPath(p);
              } else {
                tdc.book({ service: config.label, pillar: 'play', pet, channel: 'play_content_modal_footer' });
                onClose();
              }
            }}
            style={{ background:`linear-gradient(135deg,${G.orange},#FF6B9D)`, color:'#fff', border:'none', borderRadius:12, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer' }}
            data-testid="play-modal-cta">
            {category === 'soul_made' ? `Make it personal for ${petName} →`
              : category === 'outings' ? `Start ${petName}'s Park Routine →`
              : category === 'playdates' ? `Start ${petName}'s Playdate Path →`
              : category === 'walking' ? `Build ${petName}'s Walk Plan →`
              : category === 'fitness' ? `Start ${petName}'s Fitness Plan →`
              : category === 'swimming' ? `Start ${petName}'s Swim Path →`
              : `Book ${config.label} for ${petName} →`}
          </button>
        </div>
      )}
    </motion.div>
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', zIndex:700 }} />
          {isDesktop ? (
            <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:701 }}>
              {ModalContent}
            </div>
          ) : (
            <div style={{ position:'fixed', inset:0, zIndex:701, pointerEvents:'none' }}>
              <div style={{ pointerEvents:'auto' }}>{ModalContent}</div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PlayContentModal;
