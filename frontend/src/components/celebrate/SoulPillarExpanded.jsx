/**
 * SoulPillarExpanded.jsx
 * Celebrate Pillars Master Build — EXACT SPEC from Celebrate_Pillars_MASTER.docx
 * Sections: Panel header → Mira bar → Special panel (4 pillars) → Tab bar → Product grid
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Loader2, Plus } from 'lucide-react';
import { getApiUrl } from '../../utils/api';

/* ── Tab definitions — EXACT from spec ─────────────────────────────────── */
const PILLAR_TABS = {
  food:      [
    { name: 'Birthday Feast',         category: 'cakes' },
    { name: 'Everyday Treats',         category: 'treats' },
    { name: 'Special Occasion',        category: 'desi-treats' },
    { name: 'Allergy-Safe Products',   category: 'nut-butters' },
  ],
  play:      [
    { name: 'Favourite Toys',    category: 'toys' },
    { name: 'Enrichment Kits',   category: 'accessories' },
    { name: 'Activity Bundles',  category: 'accessories' },
    { name: 'Party Games',       category: 'party_accessories' },
  ],
  social:    [
    { name: 'Pawty Planning',    category: 'party_kits' },
    { name: 'Friend Gifts',      category: 'hampers' },
    { name: 'Venue Finder',      category: 'accessories' },
    { name: 'Invitations',       category: 'party_accessories' },
  ],
  adventure: [
    { name: 'Birthday Walk',     category: 'accessories' },
    { name: 'Outdoor Spots',     category: 'accessories' },
    { name: 'Adventure Gear',    category: 'accessories' },
    { name: 'Trail Treats',      category: 'treats' },
  ],
  grooming:  [
    { name: 'Grooming Booking',       category: 'grooming', concierge: true },
    { name: 'Birthday Accessories',   category: 'accessories' },
    { name: 'Spa at Home',            category: 'grooming' },
    { name: 'Photo-Ready',            category: 'accessories' },
  ],
  learning:  [
    { name: 'Puzzle Toys',           category: 'puzzles' },
    { name: 'Trick Kits',            category: 'training' },
    { name: 'Training Sessions',     category: 'training', concierge: true },
    { name: 'Brain Games',           category: 'puzzles' },
  ],
  health:    [
    { name: 'Wellness Gifts',    category: 'supplements' },
    { name: 'Supplements',       category: 'supplements' },
    { name: 'Health Check',      category: 'health' },
    { name: 'Longevity Plan',    category: 'supplements' },
  ],
  memory:    [
    { name: 'Photoshoot',        category: 'accessories', concierge: true },
    { name: 'Custom Portrait',   category: 'accessories' },
    { name: 'Memory Book',       category: 'accessories' },
    { name: 'Soul Story',        category: 'accessories' },
  ],
};

/* ── Exact Mira quotes from spec ─────────────────────────────────────────── */
const getMiraQuote = (pillarId, pet) => {
  const name = pet?.name || 'your pet';
  const friend1 = pet?.doggy_soul_answers?.pet_friends?.[0] || pet?.pet_friends?.[0] || 'Bruno';
  const friend2 = pet?.doggy_soul_answers?.pet_friends?.[1] || pet?.pet_friends?.[1] || 'Cookie';
  const condition = pet?.doggy_soul_answers?.health_conditions || pet?.health_conditions;
  const quotes = {
    food:      `"Everything here is soy-free. The salmon cake is ${name}'s number one — I put it first. This is the feast she deserves."`,
    play:      `"Play is ${name}'s top soul pillar. Tennis balls first — that's her language. Everything else follows from that."`,
    social:    `"${name} is a Social Butterfly. Her birthday isn't complete without ${friend1} and ${friend2}. I've built the pawty around all three of them."`,
    adventure: `"${name}'s happiest when she's moving. Start her birthday with a sunrise walk — that's the real gift. Everything else is extra."`,
    grooming:  `"Every birthday dog deserves to look the part. ${name}'s birthday bandana is waiting. Book the pamper session first — everything else follows."`,
    learning:  `"${name} has a bright mind. The best birthday gift is something to solve. Start with the Level 3 puzzle — she's ready for it."`,
    health:    `"The most loving thing you can give ${name} on her birthday is more time. Every product here is treatment-safe. I've checked each one personally."`,
    memory:    `"${name}'s birthday happens once. This is how you keep it. The portrait goes on the wall. The memory book is read for years. Start with the photoshoot."`,
  };
  return quotes[pillarId] || `"I've curated everything here with ${name} in mind."`;
};

/* ── Expanded titles + subtitles ─────────────────────────────────────────── */
const PILLAR_TITLES = {
  food:      { title: 'Food & Flavour — Birthday Feast',           sub: (p) => `Soy-free. Salmon-forward. Every item checked by Mira.` },
  play:      { title: 'Play & Joy — The Language {petName} Speaks', sub: (p) => `Play is ${p?.name || 'your pet'}'s top soul pillar. Start here.` },
  social:    { title: 'Social & Friends — {petName}\'s Pawty',      sub: (p) => `Bruno and Cookie are already on the list. Let's plan.` },
  adventure: { title: 'Adventure & Move — Celebrate in Motion',    sub: (p) => `${p?.name || 'your pet'}'s happiest when she's moving. Make her birthday start with her favourite thing.` },
  grooming:  { title: 'Grooming & Beauty — Birthday Glow-Up',      sub: () => `Every birthday dog deserves to look the part.` },
  learning:  { title: 'Learning & Mind — A Gift That Grows',       sub: (p) => `The best birthday gift you can give ${p?.name || 'your pet'} is something to solve.` },
  health:    { title: 'Health & Wellness — The Most Loving Gift',  sub: (p) => `I've noted ${p?.name || 'your pet'}'s health. Everything here supports her strength.` },
  memory:    { title: 'Love & Memory — Make This Birthday Permanent', sub: (p) => `${p?.name || 'your pet'}'s birthday happens once. This is how you keep it.` },
};

/* ── Special Panel: FeastMenuCard (Pillar 1 only) ────────────────────────── */
const FeastMenuCard = ({ petName }) => (
  <div className="rounded-2xl p-5 mb-4" style={{ background: 'linear-gradient(135deg, #FFF8F0, #FEF3FF)' }}>
    <p className="font-extrabold mb-3" style={{ fontSize: 15, color: '#1A0030' }}>
      🍽️ {petName}'s Birthday Feast Menu
    </p>
    <div className="grid grid-cols-3 gap-3">
      {[
        { icon: '🎂', name: 'Salmon Birthday Cake', desc: 'The centrepiece', price: '₹899' },
        { icon: '🍪', name: 'Treat Platter',         desc: 'Salmon biscuits × 12', price: '₹449' },
        { icon: '🧁', name: 'Paw Cupcakes',          desc: '6 for the guests', price: '₹349' },
      ].map(item => (
        <div key={item.name} className="rounded-xl p-3 text-center"
          style={{ background: '#FFF', border: '1px solid #F0E8F8' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
          <p className="font-bold" style={{ fontSize: 12, color: '#1A0030', marginBottom: 2 }}>{item.name}</p>
          <p style={{ fontSize: 11, color: '#888' }}>{item.desc}</p>
          <p className="font-bold mt-1.5" style={{ fontSize: 12, color: '#C44DFF' }}>{item.price}</p>
        </div>
      ))}
    </div>
    <p style={{ fontSize: 10, color: '#999', marginTop: 10 }}>
      These items can be requested via concierge. Full products with ordering below.
    </p>
  </div>
);

/* ── Special Panel: PawtyPlannerCard (Pillar 3 only) ─────────────────────── */
const PawtyPlannerCard = ({ pet }) => {
  const petName = pet?.name || 'your pet';
  const friend1 = pet?.doggy_soul_answers?.pet_friends?.[0] || 'Bruno';
  const friend2 = pet?.doggy_soul_answers?.pet_friends?.[1] || 'Cookie';
  const city = pet?.city || 'your city';
  const steps = [
    { num: 1, text: `Choose venue — Pet-friendly spot in ${city}`, action: 'Find a venue' },
    { num: 2, text: `Send invites to ${friend1} & ${friend2} — 5-pack paw print invitations`, action: 'Order invites' },
    { num: 3, text: 'Order the pawty kit — Bandanas for 3, treat bags, decorations', action: 'Add to cart' },
    { num: 4, text: 'Let Concierge handle the rest — One call, everything arranged', action: '👑 Talk to Concierge', premium: true },
  ];
  return (
    <div className="rounded-2xl p-5 mb-4" style={{ background: 'linear-gradient(135deg, #F3E5F5, #FCE4EC)' }}>
      <p className="font-extrabold mb-4" style={{ fontSize: 14, color: '#3D0060' }}>
        🦋 {petName}'s Pawty Plan — {friend1} & {friend2} invited
      </p>
      <div className="flex flex-col gap-3">
        {steps.map(step => (
          <div key={step.num} className="rounded-xl p-3 flex items-center gap-3 bg-white"
            style={{ border: '1px solid rgba(196,77,255,0.15)' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-xs"
              style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)' }}>
              {step.num}
            </div>
            <p className="flex-1" style={{ fontSize: 12, color: '#3D0060', lineHeight: 1.45 }}>{step.text}</p>
            <button className="rounded-full text-xs font-bold px-3 py-1 flex-shrink-0"
              style={{
                background: step.premium ? 'linear-gradient(135deg, #C9973A, #F0C060)' : 'rgba(196,77,255,0.12)',
                color: step.premium ? '#1A0A00' : '#7C3AED',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
              onClick={() => step.premium && window.dispatchEvent(new CustomEvent('openMiraAI', {
                detail: { message: `Help me plan ${petName}'s pawty with concierge`, context: 'celebrate' }
              }))}>
              {step.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Special Panel: WellnessHeroCard (Pillar 7 only) ─────────────────────── */
const WellnessHeroCard = ({ pet }) => {
  const petName = pet?.name || 'your pet';
  const condition = pet?.doggy_soul_answers?.health_conditions || pet?.health_conditions || '';
  const hasCondition = condition && condition !== 'none' && condition.length > 2;
  return (
    <div className="rounded-2xl p-5 text-center mb-4"
      style={{ background: 'linear-gradient(135deg, #E0F7FA, #E8F5E9)' }}>
      <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>💚</span>
      <p className="font-bold italic" style={{ fontSize: 15, color: '#1A0030', lineHeight: 1.5 }}>
        {hasCondition
          ? '"The most loving birthday gift is more time."'
          : '"The most loving birthday gift is a longer, healthier life."'}
      </p>
      <p style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginTop: 8 }}>
        {hasCondition
          ? `Mira has noted ${petName}'s ${condition}. Every product below is treatment-safe — checked individually. This is the pillar that matters most right now.`
          : `The most loving thing you can give ${petName} is investing in her long life. Every supplement here is right for her age.`}
      </p>
    </div>
  );
};

/* ── Special Panel: MemoryInvitationCard (Pillar 8 only) ─────────────────── */
const MemoryInvitationCard = ({ pet }) => {
  const petName = pet?.name || 'your pet';
  return (
    <div className="rounded-2xl p-5 text-center mb-4"
      style={{ background: 'linear-gradient(135deg, #1A0030, #3D0060)' }}>
      <span style={{ fontSize: 40, display: 'block', marginBottom: 10 }}>📸</span>
      <p className="font-extrabold" style={{ fontSize: 17, color: '#FFF', marginBottom: 8 }}>
        Make this birthday permanent
      </p>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 16 }}>
        A photoshoot. A portrait on the wall. A memory book that gets read for years.
        {petName}'s birthday happens once. This is how you keep it forever.
      </p>
      <button
        className="rounded-xl px-6 py-2.5 font-bold text-white"
        style={{
          background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
          border: 'none', cursor: 'pointer', fontSize: 13
        }}
        onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI', {
          detail: { message: `Book ${petName}'s birthday photoshoot via concierge`, context: 'celebrate' }
        }))}
      >
        Book {petName}'s Photoshoot via Concierge 👑
      </button>
    </div>
  );
};

/* ── Product card ─────────────────────────────────────────────────────────── */
const SoulProductCard = ({ product, petName, isFirst, isConcierge }) => {
  const price = product.price || product.variants?.[0]?.price || 0;
  const image = product.image_url || product.image || product.images?.[0];
  const handleAction = () => {
    if (isConcierge) {
      window.dispatchEvent(new CustomEvent('openMiraAI', {
        detail: { message: `Book "${product.name}" for ${petName} via concierge`, context: 'celebrate' }
      }));
    } else {
      window.dispatchEvent(new CustomEvent('addToCart', { detail: product }));
    }
  };
  return (
    <div className="rounded-xl overflow-hidden bg-white"
      style={{ border: '1px solid #F0E8F8' }}
      data-testid={`soul-product-${product.id || product.name?.replace(/\s/g,'')}`}>
      <div className="flex items-center justify-center bg-gray-50" style={{ height: 80 }}>
        {image
          ? <img src={image} alt={product.name} className="w-full h-full object-cover" />
          : <span style={{ fontSize: 32 }}>🎁</span>}
      </div>
      <div style={{ padding: '9px' }}>
        <div className="inline-block rounded-lg mb-1.5"
          style={{
            fontSize: 10, fontWeight: 600,
            background: isFirst
              ? 'linear-gradient(135deg,rgba(196,77,255,0.18),rgba(255,107,157,0.12))'
              : 'linear-gradient(135deg,rgba(196,77,255,0.08),rgba(255,107,157,0.06))',
            border: `1px solid ${isFirst ? 'rgba(196,77,255,0.35)' : 'rgba(196,77,255,0.18)'}`,
            padding: '2px 7px', color: '#6B21A8'
          }}>
          {isFirst ? `${petName}'s #1` : `For ${petName}`}
        </div>
        <p className="font-bold line-clamp-1" style={{ fontSize: 12, color: '#1A0030', marginBottom: 2 }}>
          {product.name}
        </p>
        {product.description && (
          <p className="line-clamp-1" style={{ fontSize: 11, color: '#888', lineHeight: 1.35, marginBottom: 7 }}>
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between gap-1">
          <span className="font-bold" style={{ fontSize: 13, color: isConcierge ? '#C9973A' : '#1A0030' }}>
            {isConcierge ? 'Concierge' : `₹${typeof price === 'number' ? price.toLocaleString('en-IN') : price}`}
          </span>
          <button onClick={handleAction}
            className="rounded-full text-white flex items-center gap-1"
            style={{
              background: isConcierge
                ? 'linear-gradient(135deg,#C9973A,#F0C060)'
                : 'linear-gradient(135deg,#C44DFF,#FF6B9D)',
              color: isConcierge ? '#1A0A00' : 'white',
              border: 'none', padding: '4px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer'
            }}>
            {isConcierge ? 'Book 👑' : <><Plus className="w-3 h-3" /> Add</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ─────────────────────────────────────────────────────── */
const SoulPillarExpanded = ({ pillar, pet, onClose, onItemAdd }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const petName = pet?.name || 'your pet';
  const tabs = PILLAR_TABS[pillar.id] || [{ name: 'All', category: 'cakes' }];
  const titleInfo = PILLAR_TITLES[pillar.id] || { title: pillar.name, sub: () => '' };
  const isConciergeTab = !!tabs[activeTab]?.concierge;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const currentCategory = tabs[activeTab]?.category || 'cakes';
        const resp = await fetch(`${apiUrl}/api/products?category=${currentCategory}&limit=8`);
        if (resp.ok) {
          const data = await resp.json();
          setProducts(data.products || []);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('[SoulPillarExpanded]', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [pillar.id, activeTab]);

  // Allergy filter
  const allergies = React.useMemo(() => {
    return [
      ...(pet?.allergies || []),
      ...(Array.isArray(pet?.doggy_soul_answers?.food_allergies)
        ? pet.doggy_soul_answers.food_allergies
        : pet?.doggy_soul_answers?.food_allergies ? [pet.doggy_soul_answers.food_allergies] : [])
    ].map(a => a?.toLowerCase()).filter(a => a && a !== 'none');
  }, [pet]);

  const filteredProducts = React.useMemo(() => {
    if (!allergies.length) return products;
    return products.filter(p => {
      const text = ((p.name || '') + (p.description || '')).toLowerCase();
      return !allergies.some(a => text.includes(a));
    });
  }, [products, allergies]);

  const handleAddToCart = (product) => {
    window.dispatchEvent(new CustomEvent('addToCart', { detail: product }));
    onItemAdd?.(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, maxHeight: 0 }}
      animate={{ opacity: 1, maxHeight: 1000 }}
      exit={{ opacity: 0, maxHeight: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white overflow-hidden"
      style={{
        gridColumn: '1 / -1',
        borderRadius: 18,
        border: '2px solid #C44DFF',
        boxShadow: '0 4px 24px rgba(196,77,255,0.12)',
        marginTop: 4, marginBottom: 8
      }}
      data-testid={`pillar-expanded-${pillar.id}`}
    >
      {/* 1 — Panel header */}
      <div className="flex items-start gap-3 px-6 pt-5 pb-0 mb-4">
        <span style={{ fontSize: 32, flexShrink: 0 }}>{pillar.icon}</span>
        <div className="flex-1">
          <h3 className="font-extrabold" style={{ fontSize: 18, color: '#1A0030', lineHeight: 1.2 }}>
            {titleInfo.title.replace('{petName}', petName)}
          </h3>
          <p style={{ fontSize: 12, color: '#888888', marginTop: 3 }}>
            {titleInfo.sub(pet)}
          </p>
        </div>
        <button onClick={onClose}
          className="flex-shrink-0 rounded-full font-bold"
          style={{ background: '#F3E8FF', border: 'none', padding: '5px 14px', fontSize: 12, color: '#7C3AED', cursor: 'pointer' }}>
          Close
        </button>
      </div>

      {/* 2 — Mira bar */}
      <div className="mx-6 mb-4 rounded-xl p-3 flex items-start gap-2.5"
        style={{ background: 'linear-gradient(135deg, #F3E8FF, #FCE4EC)' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)', marginTop: 1 }}>
          ✦
        </div>
        <div>
          <p style={{ fontSize: 13, color: '#3D0060', lineHeight: 1.55, fontStyle: 'italic' }}>
            {getMiraQuote(pillar.id, pet)}
          </p>
          <span style={{ fontSize: 11, color: '#C44DFF', marginTop: 3, fontWeight: 600, display: 'block' }}>
            ♥ Mira knows {petName}
          </span>
        </div>
      </div>

      {/* 3 — Special panel (pillars 1, 3, 7, 8 only) */}
      <div className="mx-6">
        {pillar.id === 'food'    && <FeastMenuCard petName={petName} />}
        {pillar.id === 'social'  && <PawtyPlannerCard pet={pet} />}
        {pillar.id === 'health'  && <WellnessHeroCard pet={pet} />}
        {pillar.id === 'memory'  && <MemoryInvitationCard pet={pet} />}
      </div>

      {/* 4 — Tab bar */}
      <div className="flex flex-wrap gap-1.5 px-6 mb-4">
        {tabs.map((tab, idx) => (
          <button key={tab.name} onClick={() => setActiveTab(idx)}
            className="rounded-full font-semibold"
            style={{
              padding: '6px 14px', fontSize: 12, cursor: 'pointer', transition: 'all 120ms',
              border: activeTab === idx ? '1px solid #C44DFF' : '1px solid #E0CCFF',
              background: activeTab === idx ? '#C44DFF' : '#FAF5FF',
              color: activeTab === idx ? '#FFFFFF' : '#7C3AED',
            }}>
            {tab.name}
          </button>
        ))}
      </div>

      {/* 5 — Product grid */}
      <div className="px-6 pb-5">
        {allergies.length > 0 && (
          <div className="mb-3 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            style={{ background: '#FFF3E0', border: '1px solid #FFCC99', color: '#8B4500' }}>
            <span>🛡️</span>
            <span>Showing only {petName}-safe items (no {allergies.join(', ')})</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            <span className="ml-3 text-sm text-gray-500">Finding perfect items for {petName}...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl block mb-3">🎁</span>
            <p className="text-sm text-gray-500 mb-4">We're curating the perfect {pillar.name.toLowerCase()} items for {petName}.</p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI', {
                detail: { message: `Suggest ${pillar.name} celebration ideas for ${petName}`, context: 'celebrate' }
              }))}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
              style={{ background: 'rgba(196,77,255,0.10)', border: '1px solid rgba(196,77,255,0.30)', color: '#7C3AED' }}>
              <Sparkles className="w-4 h-4" /> Ask Mira
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {filteredProducts.slice(0, 4).map((product, idx) => (
              <SoulProductCard
                key={product.id || idx}
                product={product}
                petName={petName}
                isFirst={idx === 0}
                isConcierge={isConciergeTab}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SoulPillarExpanded;
