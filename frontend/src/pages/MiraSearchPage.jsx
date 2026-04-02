/**
 * MiraSearchPage — /mira-search
 * "The Google Bar" — streaming Mira response + product/service chips
 * Members only. No nav, no sidebar, no footer.
 * Standalone — does not affect any existing pages.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getApiUrl } from '../utils/api';
import { toast, Toaster } from 'sonner';
import CartSidebar from '../components/CartSidebar';
import { ProductDetailModal } from '../components/ProductCard';
import MiraImaginesBreed from '../components/common/MiraImaginesBreed';

// ── Icons ──────────────────────────────────────────────────────────────────
import {
  Search, X, ShoppingCart, Calendar,
  Sparkles, Send,
} from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  night:   '#0D0B12',
  surface: '#13111A',
  card:    '#1C1928',
  border:  'rgba(255,255,255,0.07)',
  amber:   '#C9973A',
  amberL:  '#E8B554',
  ivory:   '#F5F0E8',
  muted:   'rgba(245,240,232,0.45)',
  purple:  '#7C3AED',
  purpleL: '#A78BFA',
  green:   '#10B981',
  text:    '#EDE9E0',
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (price) => {
  if (!price || price === 0) return 'Price on Request';
  return `₹${Number(price).toLocaleString('en-IN')}`;
};

const soulColor = (score) => {
  if (score >= 80) return C.green;
  if (score >= 50) return C.amber;
  return '#EF4444';
};

// ── Soul nudge banner ──────────────────────────────────────────────────────
function SoulNudge({ pet }) {
  const score = Math.round(pet?.overall_score || 0);
  const isComplete = score >= 80;
  return (
    <Link to="/pet-home" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderRadius: 12,
      background: isComplete ? 'rgba(16,185,129,0.07)' : 'rgba(201,151,58,0.1)',
      border: `1px solid ${isComplete ? 'rgba(16,185,129,0.25)' : 'rgba(201,151,58,0.3)'}`,
      textDecoration: 'none', marginBottom: 16,
    }}>
      <Sparkles size={14} color={isComplete ? C.green : C.amber} />
      <span style={{ fontSize: 13, color: isComplete ? C.green : C.amber, fontFamily: 'DM Sans, sans-serif' }}>
        {isComplete
          ? `${pet?.name || 'Your dog'}'s soul profile is complete · Update anytime →`
          : `Tell Mira ${Math.ceil((80 - score) / 10)} more things about ${pet?.name || 'your dog'} to unlock full personalisation →`}
      </span>
    </Link>
  );
}

// ── Pet selector chip ──────────────────────────────────────────────────────
function PetChip({ pet, active, onClick }) {
  const score = Math.round(pet?.overall_score || 0);
  const img = pet?.photo_url || pet?.profile_image;
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 12px 6px 6px', borderRadius: 999,
      border: `1.5px solid ${active ? C.amber : C.border}`,
      background: active ? 'rgba(201,151,58,0.1)' : C.card,
      cursor: 'pointer', transition: 'all 0.18s',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0,
        background: 'linear-gradient(135deg,#7C3AED,#EC4899)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {img
          ? <img src={img} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 12 }}>🐾</span>}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: active ? C.amber : C.text, fontFamily: 'DM Sans, sans-serif' }}>
        {pet?.name}
      </span>
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: soulColor(score), fontFamily: 'DM Sans, sans-serif',
      }}>
        {score}%
      </span>
    </button>
  );
}

// ── Streaming text renderer ────────────────────────────────────────────────
function StreamingText({ text, streaming }) {
  if (!text) return null;
  return (
    <div style={{
      fontFamily: 'DM Sans, sans-serif',
      fontSize: 15, lineHeight: 1.75,
      color: C.text, whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}>
      {text}
      {streaming && (
        <span style={{
          display: 'inline-block', width: 2, height: '1em',
          background: C.amberL, marginLeft: 2,
          animation: 'blink 1s step-end infinite',
          verticalAlign: 'text-bottom',
        }} />
      )}
    </div>
  );
}

// ── Product / service chip ─────────────────────────────────────────────────
function ResultChip({ item, type, pet, onBook, onCart, onCardClick }) {
  const img = item.cloudinary_url || item.photo_url || item.image_url || item.image;
  const price = item.original_price || item.price || 0;
  const isService = type === 'service';

  return (
    <div
      onClick={() => onCardClick && onCardClick(item)}
      style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 14, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        minWidth: 160, maxWidth: 200, flexShrink: 0,
        transition: 'border-color 0.18s, transform 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,151,58,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Image */}
      <div style={{ width: '100%', height: 100, background: '#1a1724', overflow: 'hidden', flexShrink: 0 }}>
        {img
          ? <img src={img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {isService ? '🐾' : '🛒'}
            </div>}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 10px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {item.name}
        </div>
        <div style={{ fontSize: 11, color: C.amber, fontWeight: 700, fontFamily: 'DM Sans, sans-serif' }}>
          {isService ? 'Price on Request' : fmt(price)}
        </div>
      </div>

      {/* CTA — stopPropagation so card click (modal) doesn't also fire */}
      <div style={{ padding: '0 10px 10px' }}>
        {isService ? (
          <button
            onClick={e => { e.stopPropagation(); onBook(item); }}
            style={{
              width: '100%', padding: '6px 0',
              borderRadius: 8, border: `1px solid ${C.amber}`,
              background: 'transparent', color: C.amber,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
            <Calendar size={11} /> Book →
          </button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onCart(item); }}
            style={{
              width: '100%', padding: '6px 0',
              borderRadius: 8, border: 'none',
              background: `linear-gradient(135deg,${C.amber},${C.amberL})`,
              color: '#0D0B12',
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
            <ShoppingCart size={11} /> Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

// ── Quick prompts ──────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { emoji: '🎂', label: 'Plan birthday' },
  { emoji: '🍽️', label: 'What to eat today' },
  { emoji: '✂️', label: 'Book a groomer' },
  { emoji: '💊', label: 'Health check' },
  { emoji: '🧸', label: 'Find a toy' },
  { emoji: '✈️', label: 'Plan a trip' },
];

// ── Main Page ──────────────────────────────────────────────────────────────
export default function MiraSearchPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [pets, setPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [query, setQuery] = useState('');
  const [followUp, setFollowUp] = useState('');
  // turns = [{ id, query, response, products, services, streaming }]
  const [turns, setTurns] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selProduct, setSelProduct] = useState(null);

  const inputRef = useRef(null);
  const followUpRef = useRef(null);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user && !token) {
      navigate('/login?redirect=/mira-search');
    }
  }, [user, token, navigate]);

  // ── Load pets ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${getApiUrl()}/api/pets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : (data.pets || []);
        setPets(list);
        setActivePet(list[0] || null);
      })
      .catch(() => {});
  }, [token]);

  // ── Focus input on mount ──────────────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Scroll to bottom after each new turn ─────────────────────────────────
  useEffect(() => {
    if (turns.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [turns.length, turns[turns.length - 1]?.response?.length]);

  // ── Stream handler ────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (searchQuery) => {
    const q = (searchQuery || query).trim();
    if (!q) return;
    if (!activePet) { toast.error('Please select a pet first'); return; }

    // Check if any turn is already streaming
    const anyStreaming = turns.some(t => t.streaming);
    if (anyStreaming) return;

    // Cancel previous abort
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const turnId = Date.now();

    // Build history from previous turns
    const history = turns.flatMap(t => [
      { role: 'user', content: t.query },
      { role: 'assistant', content: t.response || '' },
    ]).slice(-10);

    // Add this turn to the conversation
    setTurns(prev => [...prev, {
      id: turnId, query: q,
      response: '', streaming: true,
      products: [], services: [],
    }]);
    setHasSearched(true);
    setQuery('');
    setFollowUp('');

    const body = {
      message: q,
      session_id: `search_${turnId}`,
      source: 'mira_search',
      current_pillar: 'general',
      selected_pet_id: activePet?.id || activePet?._id,
      pet_name: activePet?.name,
      pet_breed: activePet?.breed || activePet?.identity?.breed || null,
      soul_answers: activePet?.doggy_soul_answers || {},
      history,
    };

    const updateTurn = (patch) =>
      setTurns(prev => prev.map(t => t.id === turnId ? { ...t, ...patch } : t));

    try {
      const res = await fetch(`${getApiUrl()}/api/mira/os/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let enrichedProducts = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') { reader.cancel(); break; }
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'enriched') {
              enrichedProducts = parsed.data?.products || [];
              // nearby_places is a FLAG {show_nearme:true}, not an array.
              // Services DB is empty — show a booking CTA when flag fires
              const nearbyFlag = parsed.data?.nearby_places;
              if (nearbyFlag?.show_nearme) {
                setTurns(prev => prev.map(t =>
                  t.id === turnId ? { ...t, servicesCta: true } : t
                ));
              }
              continue;
            }
            const tok = parsed.text || parsed.delta || parsed.content || '';
            if (!tok) continue;
            fullText += tok;
            updateTurn({ response: fullText });
          } catch {}
        }
      }

      // ── Step 1: use enriched products from stream if available ────────────
      const prods = enrichedProducts.filter(p => p.product_type !== 'service').slice(0, 6);
      updateTurn({ streaming: false, response: fullText, products: prods, services: [] });

      // ── Step 2: fallback to claude-picks (soul-personalised) if stream returned nothing ──
      const petId = activePet?.id || activePet?._id;
      if (prods.length === 0 && petId) {
        fetch(`${getApiUrl()}/api/mira/claude-picks/${petId}?limit=6&min_score=30`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
          .then(r => r.ok ? r.json() : null)
          .then(d => {
            const picks = d?.picks || d?.products || [];
            if (picks.length > 0) {
              updateTurn({ products: picks.slice(0, 6) });
            } else {
              // ── Step 3: no picks at all — flag MiraImaginesBreed ────────
              updateTurn({ showImagines: true });
            }
          })
          .catch(() => { updateTurn({ showImagines: true }); });
      }

      // Focus the follow-up input
      setTimeout(() => followUpRef.current?.focus(), 300);

    } catch (err) {
      if (err.name !== 'AbortError') {
        updateTurn({ streaming: false, response: 'Mira had a moment. Please try again.' });
      }
    }
  }, [query, followUp, activePet, token, turns]);

  // ── WhatsApp — send full conversation ────────────────────────────────────
  const handleWhatsApp = () => {
    if (!turns.length) return;
    const lines = turns
      .filter(t => t.response)
      .map(t => `*You:* ${t.query}\n*Mira:* ${t.response.slice(0, 400)}${t.response.length > 400 ? '…' : ''}`)
      .join('\n\n');
    const msg = `*Mira conversation for ${petName}:*\n\n${lines}\n\n_Powered by The Doggy Company_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const petName = activePet?.name || 'your dog';
  const soulScore = Math.round(activePet?.overall_score || 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100dvh', background: C.night,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'DM Sans, sans-serif',
      padding: '0 16px 120px',
    }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .ms-chip-scroll::-webkit-scrollbar { display:none; }
        .ms-chip-scroll { scrollbar-width:none; }
        .ms-qp-btn:hover { background: rgba(201,151,58,0.12) !important; border-color: rgba(201,151,58,0.4) !important; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{
        width: '100%', maxWidth: 720,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 0 24px',
        borderBottom: `1px solid ${C.border}`,
        marginBottom: 28,
      }}>
        {/* Mira wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#7C3AED,#EC4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.ivory, letterSpacing: '-0.02em' }}>Mira</span>
        </div>

        {/* Pet selector + cart icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {pets.slice(0, 4).map(pet => (
            <PetChip
              key={pet.id || pet._id}
              pet={pet}
              active={activePet?.id === pet.id || activePet?._id === pet._id}
              onClick={() => setActivePet(pet)}
            />
          ))}
          {/* Cart icon */}
          <button
            onClick={() => setCartOpen(true)}
            data-testid="mira-search-cart"
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: C.card, border: `1.5px solid ${C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.amber}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <ShoppingCart size={16} color={C.amber} />
          </button>
        </div>
      </div>

      {/* ── Soul nudge ── */}
      {activePet && <div style={{ width: '100%', maxWidth: 720 }}>
        <SoulNudge pet={activePet} />
      </div>}

      {/* ── Search bar (hidden after first search — follow-up bar takes over) ── */}
      {!hasSearched && <div
        style={{
          width: '100%', maxWidth: 720,
          background: C.surface,
          border: `1.5px solid ${C.border}`,
          borderRadius: 20, padding: '4px 6px 4px 20px',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 0 40px rgba(124,58,237,0.08)',
          marginBottom: 28,
        }}
      >
        <Search size={18} color={C.muted} style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          placeholder={`What can Mira do for ${petName} today?`}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: 16, color: C.ivory, fontFamily: 'DM Sans, sans-serif',
            padding: '12px 0', caretColor: C.amber,
          }}
          data-testid="mira-search-input"
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.muted }}>
            <X size={16} />
          </button>
        )}
        <button
          onClick={() => handleSearch()}
          disabled={!query.trim() || turns.some(t => t.streaming)}
          data-testid="mira-search-submit"
          style={{
            padding: '10px 18px', borderRadius: 14,
            border: 'none', cursor: query.trim() && !turns.some(t => t.streaming) ? 'pointer' : 'not-allowed',
            background: query.trim() && !turns.some(t => t.streaming)
              ? `linear-gradient(135deg,${C.amber},${C.amberL})`
              : 'rgba(255,255,255,0.06)',
            color: query.trim() && !turns.some(t => t.streaming) ? C.night : C.muted,
            fontWeight: 700, fontSize: 14, fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.18s', flexShrink: 0,
          }}
        >
          {turns.some(t => t.streaming)
            ? <><span style={{ width: 14, height: 14, border: `2px solid ${C.muted}`, borderTopColor: C.amber, borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Thinking</>
            : <><Send size={14} /> Ask</>}
        </button>
      </div>}

      {/* ── Quick prompts (only before first search) ── */}
      {!hasSearched && (
        <div style={{ width: '100%', maxWidth: 720, marginTop: 32, animation: 'fadeUp 0.4s ease' }}>
          <p style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600 }}>
            Try asking
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUICK_PROMPTS.map(p => (
              <button
                key={p.label}
                className="ms-qp-btn"
                onClick={() => { setQuery(p.label); handleSearch(p.label); }}
                style={{
                  padding: '8px 16px', borderRadius: 999,
                  border: `1px solid ${C.border}`,
                  background: C.card, color: C.text,
                  fontSize: 13, cursor: 'pointer',
                  fontFamily: 'DM Sans, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <span>{p.emoji}</span> {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Conversation thread ── */}
      {turns.map((turn, idx) => {
        const isLast = idx === turns.length - 1;
        return (
          <div key={turn.id} style={{ width: '100%', maxWidth: 720, marginBottom: 8, animation: 'fadeUp 0.3s ease' }}>

            {/* User message */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
              <div style={{
                background: 'rgba(201,151,58,0.12)',
                border: `1px solid rgba(201,151,58,0.25)`,
                borderRadius: '18px 18px 4px 18px',
                padding: '10px 16px',
                maxWidth: '80%',
                fontSize: 14, color: C.ivory,
                fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5,
              }}>
                {turn.query}
              </div>
            </div>

            {/* Mira response */}
            {(turn.response || turn.streaming) && (
              <div style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 20, padding: '20px 24px 18px',
                marginBottom: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#7C3AED,#EC4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Sparkles size={11} color="#fff" />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.purpleL }}>Mira</span>
                  {turn.streaming && (
                    <span style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>thinking for {petName}…</span>
                  )}
                </div>
                <StreamingText text={turn.response} streaming={turn.streaming} />
              </div>
            )}

            {/* Products for this turn */}
            {turn.products?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, fontWeight: 600 }}>
                  Mira picks for {petName}
                </p>
                <div className="ms-chip-scroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                  {turn.products.map((p, i) => (
                    <ResultChip key={p.id || p._id || i} item={p} type="product" pet={activePet}
                      onCardClick={item => setSelProduct(item)}
                      onCart={item => { addToCart(item); toast.success(`${item.name} added to cart! 🛒`); }}
                      onBook={() => {}} />
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — MiraImaginesBreed: shown when both stream + claude-picks returned nothing */}
            {turn.showImagines && !turn.streaming && activePet && (
              <div style={{ marginBottom: 12, animation: 'fadeUp 0.4s ease' }}>
                <MiraImaginesBreed
                  pet={activePet}
                  pillar="general"
                  colour={C.amber}
                  onConcierge={() => {}}
                />
              </div>
            )}

            {/* Services CTA — fires when nearby_places flag is true, DB is currently empty */}
            {turn.servicesCta && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                marginBottom: 12, animation: 'fadeUp 0.35s ease',
              }}>
                <Calendar size={16} color={C.purpleL} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: C.text, fontFamily: 'DM Sans, sans-serif', flex: 1 }}>
                  Looking for services near you?
                </span>
                <a href="/services" style={{
                  fontSize: 13, fontWeight: 700, color: C.amber,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}>
                  Book via Concierge →
                </a>
              </div>
            )}

            {/* ── Follow-up input (only after last turn completes) ── */}
            {isLast && !turn.streaming && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: C.card,
                border: `1.5px solid rgba(201,151,58,0.25)`,
                borderRadius: 16, padding: '6px 8px 6px 16px',
                marginTop: 4, marginBottom: 8,
                transition: 'border-color 0.2s',
              }}>
                <input
                  ref={followUpRef}
                  value={followUp}
                  onChange={e => setFollowUp(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && followUp.trim()) handleSearch(followUp.trim()); }}
                  placeholder="Ask a follow-up…"
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontSize: 14, color: C.ivory,
                    fontFamily: 'DM Sans, sans-serif', padding: '8px 0',
                    caretColor: C.amber,
                  }}
                  data-testid="mira-search-followup"
                />
                <button
                  onClick={() => followUp.trim() && handleSearch(followUp.trim())}
                  disabled={!followUp.trim()}
                  style={{
                    padding: '8px 14px', borderRadius: 12, border: 'none',
                    background: followUp.trim()
                      ? `linear-gradient(135deg,${C.amber},${C.amberL})`
                      : 'rgba(255,255,255,0.06)',
                    color: followUp.trim() ? C.night : C.muted,
                    fontWeight: 700, fontSize: 13,
                    cursor: followUp.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'DM Sans, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s', flexShrink: 0,
                  }}
                >
                  <Send size={13} /> Ask
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Scroll anchor */}
      <div ref={bottomRef} style={{ height: 100 }} />

      {/* ── WhatsApp bottom bar (fixed) — shown after first complete turn ── */}
      {turns.some(t => t.response && !t.streaming) && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 16px',
          background: `linear-gradient(to top, ${C.night} 70%, transparent)`,
          display: 'flex', justifyContent: 'center',
          zIndex: 50,
          animation: 'fadeUp 0.3s ease',
        }}>
          <button
            onClick={handleWhatsApp}
            data-testid="mira-search-whatsapp"
            style={{
              padding: '13px 28px', borderRadius: 999,
              border: 'none', background: '#25D366',
              color: '#fff', fontWeight: 700, fontSize: 15,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 24px rgba(37,211,102,0.35)',
            }}
          >
            <span style={{ fontSize: 18 }}>💬</span>
            Send full conversation to WhatsApp →
          </button>
        </div>
      )}

      {/* ── CartSidebar ── */}
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ── ProductDetailModal — card tap opens this ── */}
      {selProduct && (
        <ProductDetailModal
          product={selProduct}
          pillar={selProduct?.pillar || 'celebrate'}
          selectedPet={activePet}
          onClose={() => setSelProduct(null)}
        />
      )}

      {/* Toaster — bottom-center, offset above WhatsApp bar */}
      <Toaster
        position="bottom-center"
        toastOptions={{ style: { marginBottom: 80 } }}
        richColors
      />
    </div>
  );
}
