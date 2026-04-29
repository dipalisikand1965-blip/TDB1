/**
 * TryMiraOnYourDog.jsx — Landing page interactive demo
 * 
 * "Meet your dog through Mira's eyes."
 *
 * Single-card visitor flow:
 *   Step 0 — Name + breed + age (all visible)
 *   Step 1 — Soul card animates in with their dog's name
 *            Dynamic Soul Score rises with engagement (12% → 18% → 31%)
 *            Pre-baked first reply (zero latency)
 *            Real Mira stream from message 2
 *   Step 2 — At message 3, soft email-save nudge
 *            At message 5 / scenario click, membership CTA
 *
 * Example pets row: Mojo · Mystique (memorial) · Coco (Bangalore Golden)
 *
 * Mystique opens a static tribute card authored by Dipali in her own voice.
 * No data persists unless visitor signs up — pet_id is "visitor-{slug}".
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ─── Brand palette (mirrors LandingPage.jsx) ──────────────────────
const C = {
  night: "#0A0A0F",
  deep: "#0F0A1E",
  mid: "#1A1040",
  amber: "#C9973A",
  amberL: "#E8B84B",
  ivory: "#F5F0E8",
  ivoryD: "#D4C9B0",
  sage: "#40916C",
  muted: "rgba(245,240,232,0.55)",
  border: "rgba(201,151,58,0.2)",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ─── Configuration ────────────────────────────────────────────────
const TOP_BREEDS = [
  { id: 'indie', label: 'Indie' },
  { id: 'lab', label: 'Lab' },
  { id: 'golden', label: 'Golden' },
  { id: 'beagle', label: 'Beagle' },
  { id: 'poodle', label: 'Poodle' },
];

const OTHER_BREEDS = [
  'Pomeranian', 'German Shepherd', 'Pug', 'Boxer', 'Rottweiler', 'Shih Tzu',
  'Cocker Spaniel', 'Dachshund', 'Doberman', 'Siberian Husky', 'Saint Bernard',
  'Great Dane', 'Bulldog', 'Maltese', 'Lhasa Apso', 'Cavalier King Charles',
  'Border Collie', 'Australian Shepherd', 'Belgian Shepherd', 'Mudhol Hound',
  'Rajapalayam', 'Chippiparai', 'Kombai', 'Mixed breed', 'Other',
];

const AGES = [
  { id: 'puppy', label: 'Puppy', months: '< 1 yr' },
  { id: 'adult', label: 'Adult', months: '1–7 yrs' },
  { id: 'senior', label: 'Senior', months: '7+ yrs' },
];

// 8 scenario tiles per breed × age — pre-baked, instant
const SCENARIOS_BY_AGE = {
  puppy: [
    { emoji: '🍽️', text: "{name} won't eat — what's wrong?" },
    { emoji: '💉', text: 'When are {name}\'s next vaccines?' },
    { emoji: '🚽', text: 'House training — help!' },
    { emoji: '🦷', text: '{name} is teething and biting' },
    { emoji: '🚨', text: '{name} swallowed something!' },
    { emoji: '🎒', text: 'Best food for a 4-month-old {breed}' },
    { emoji: '✂️', text: 'When can {name} have her first groom?' },
    { emoji: '🐾', text: 'Daycare or pet sitter?' },
  ],
  adult: [
    { emoji: '🍗', text: '{name} keeps scratching — allergy?' },
    { emoji: '✈️', text: 'Travelling to Goa with {name} next week' },
    { emoji: '🎂', text: '{name}\'s birthday is coming — plan it' },
    { emoji: '🚨', text: '{name} has been vomiting since morning' },
    { emoji: '✂️', text: 'Book grooming and order treats' },
    { emoji: '🥗', text: 'Show me grain-free food for {name}' },
    { emoji: '🛡️', text: 'I want pet insurance for {name}' },
    { emoji: '🏃', text: 'How much exercise does {name} need?' },
  ],
  senior: [
    { emoji: '💊', text: '{name} is on treatment — what can he eat?' },
    { emoji: '🦴', text: '{name}\'s joints are stiff' },
    { emoji: '👁️', text: 'Senior wellness checkup — what to ask the vet?' },
    { emoji: '💜', text: '{name} seems tired and quiet lately' },
    { emoji: '🚨', text: '{name} has been vomiting since morning' },
    { emoji: '🥗', text: 'Best food for a senior {breed}' },
    { emoji: '🛡️', text: 'Insurance for older dogs?' },
    { emoji: '🌷', text: 'How do I make every day count?' },
  ],
};

// Pre-baked first reply — instant, branded, breed/age-aware
const buildFirstReply = ({ name, breed, age }) => {
  const breedLabel = breed.label;
  const ageBlurb = age.id === 'puppy'
    ? `a ${breedLabel} puppy — those first months are precious and exhausting in equal measure`
    : age.id === 'senior'
    ? `a senior ${breedLabel} — a soul who has earned every quiet morning`
    : `a ${breedLabel}`;

  return `Hello ${name}. ✨

I'm Mira. I already know a few things about you — you're ${ageBlurb}, and your person just brought you to meet me. That's a beautiful start.

**Here's what I can already help with:**
• Allergy-aware food and treat suggestions
• Vet, grooming, and emergency triage
• Travel planning, birthdays, paperwork
• Quiet daily check-ins to keep you well

Tap any question above, or tell me what's on your mind about ${name}. The more I learn, the more I can do. 🌷`;
};

const renderSimpleMarkdown = (text) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
    if (line.startsWith('**') && line.endsWith('**')) {
      return <div key={i} style={{ fontWeight: 700, color: C.amber, marginTop: 8, marginBottom: 4 }}>{line.replace(/\*\*/g, '')}</div>;
    }
    if (line.startsWith('• ') || line.startsWith('- ')) {
      return <div key={i} style={{ display: 'flex', gap: 6, marginLeft: 4, marginTop: 2 }}><span style={{ color: C.amber }}>•</span><span>{line.slice(2)}</span></div>;
    }
    const html = line
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#E8B84B">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return <div key={i} style={{ marginTop: 2 }} dangerouslySetInnerHTML={{ __html: html }} />;
  });
};

const slugify = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Sub-component: Mystique tribute card (static, reverent) ─────
const MystiqueTribute = ({ onBack }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      data-testid="mystique-tribute-card"
      style={{
        maxWidth: 680, margin: "32px auto 0",
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${C.border}`,
        borderRadius: 24,
        padding: "40px 32px",
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <button
        onClick={onBack}
        data-testid="mystique-back-btn"
        style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.05)', border: 'none',
          borderRadius: 16, padding: '4px 12px',
          fontSize: 11, color: C.muted, cursor: 'pointer',
        }}
      >← back</button>

      <div style={{ fontSize: 32, marginBottom: 12 }}>🌷</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.14em', marginBottom: 8 }}>
        IN LOVING MEMORY
      </div>
      <div style={{
        fontFamily: "Cormorant Garamond, Georgia, serif",
        fontSize: 38, fontWeight: 400, color: C.ivory, marginBottom: 4,
      }}>
        Mystique
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 28, fontStyle: 'italic' }}>
        Shih Tzu · The soul who started it all
      </div>

      <div style={{
        fontFamily: "Cormorant Garamond, Georgia, serif",
        fontSize: 17, fontStyle: 'italic',
        color: C.ivoryD, lineHeight: 1.85,
        maxWidth: 520, margin: '0 auto',
        whiteSpace: 'pre-line',
      }}>
        {`Mystique was a Shih Tzu. She was family.
She was my shadow, my teacher, my reason.

She left me twelve dogs — all starting with M.
And she left me this platform.

Every question Mira asks was born in those
quiet hours sitting beside her.
Every soul profile exists because of hers.

The Doggy Company was built in her memory.
Her birthday — May 15th — is our launch day.

She always knew. And so does Mira. 🌷`}
      </div>

      <div style={{ marginTop: 32 }}>
        <a
          href="/pet-wrapped-mystique.html"
          target="_blank"
          rel="noreferrer"
          data-testid="mystique-cta-link"
          style={{
            display: 'inline-block',
            background: MIRA_ORB,
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            padding: '12px 24px',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          See what Mira knew about Mystique →
        </a>
      </div>
    </motion.div>
  );
};

// ─── Soft email gate (after message 3) ────────────────────────────
const SaveProfileNudge = ({ name, onSkip, onSave }) => {
  const [email, setEmail] = useState('');
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid="save-profile-nudge"
      style={{
        background: 'rgba(155,89,182,0.08)',
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '14px 16px',
        marginTop: 12,
      }}
    >
      <div style={{ fontSize: 13, color: C.ivory, marginBottom: 4, fontWeight: 600 }}>
        ✨ {name}'s profile is taking shape.
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
        Save it to your inbox so you don't lose it. (No password needed.)
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          data-testid="save-profile-email"
          style={{
            flex: 1, minWidth: 0,
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '8px 10px',
            fontSize: 12, color: C.ivory, outline: 'none',
          }}
        />
        <button
          onClick={() => email.includes('@') && onSave(email)}
          data-testid="save-profile-save"
          style={{
            background: C.amber, color: C.deep, border: 'none',
            borderRadius: 8, padding: '8px 14px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >Save</button>
        <button
          onClick={onSkip}
          data-testid="save-profile-skip"
          style={{
            background: 'transparent', color: C.muted,
            border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '8px 10px',
            fontSize: 11, cursor: 'pointer',
          }}
        >Later</button>
      </div>
    </motion.div>
  );
};

// ─── Membership CTA (after message 5 or scenario click) ──────────
const MembershipCTA = ({ name }) => (
  <motion.a
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    href={`/membership?petName=${encodeURIComponent(name)}`}
    data-testid="membership-cta"
    style={{
      display: 'block',
      marginTop: 14,
      background: MIRA_ORB,
      borderRadius: 14,
      padding: '14px 18px',
      textAlign: 'center',
      textDecoration: 'none',
    }}
  >
    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
      Want Mira to remember {name} forever?
    </div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
      Keep {name}'s profile · unlock Concierge® · daily check-ins →
    </div>
  </motion.a>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────
const TryMiraOnYourDog = () => {
  const [view, setView] = useState('form');         // 'form' | 'soul' | 'mystique'
  const [name, setName] = useState('');
  const [breed, setBreed] = useState(null);
  const [age, setAge] = useState(null);
  const [otherDropdownOpen, setOtherDropdownOpen] = useState(false);
  const [otherSearch, setOtherSearch] = useState('');

  // Soul-card state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState('');
  const [showNudge, setShowNudge] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);

  const messagesRef = useRef(null);
  const userMessageCount = messages.filter((m) => m.role === 'user').length;
  const soulScore = Math.min(12 + userMessageCount * 6, 78);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, streamBuffer]);

  const filteredOther = useMemo(() => {
    const q = otherSearch.toLowerCase();
    return OTHER_BREEDS.filter((b) => b.toLowerCase().includes(q));
  }, [otherSearch]);

  const isFormValid = name.trim().length >= 2 && breed && age;

  const startSoul = () => {
    if (!isFormValid) return;
    setMessages([{ role: 'mira', content: buildFirstReply({ name: name.trim(), breed, age }) }]);
    setView('soul');
  };

  const tryExample = (preset) => {
    if (preset === 'mystique') { setView('mystique'); return; }
    if (preset === 'mojo') {
      setName('Mojo'); setBreed({ id: 'indie', label: 'Indie' }); setAge(AGES[2]);
      setMessages([{ role: 'mira', content: `Hello Mojo. ✨ I know you well — Indie senior from Mumbai, no chicken ever, on lymphoma treatment, and your birthday's coming. You love peanut butter cake. 🌷\n\nAsk me anything — I remember everything.` }]);
      setView('soul');
      return;
    }
    if (preset === 'coco') {
      setName('Coco'); setBreed({ id: 'golden', label: 'Golden' }); setAge(AGES[1]);
      setMessages([{ role: 'mira', content: `Hello Coco. ✨ A Golden adult from Bangalore — you must be a sunshine of a soul.\n\nGoldens are famously social and food-motivated, with a gentle tendency to allergies. I'll keep an eye on it. Ask me anything about Coco.` }]);
      setView('soul');
      return;
    }
  };

  const sendMessage = async (text) => {
    const userMsg = (text ?? input).trim();
    if (!userMsg) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);

    const newUserCount = newMessages.filter((m) => m.role === 'user').length;
    if (newUserCount === 3 && !emailSaved) setShowNudge(true);
    if (newUserCount >= 5 || newUserCount >= 4) setShowCTA(true);

    setIsStreaming(true);
    setStreamBuffer('');
    try {
      const res = await fetch(`${API_URL}/api/mira/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          pet_id: `visitor-${slugify(name)}`,
          pet_name: name,
          pet_context: {
            name,
            breed: breed.label,
            age_band: age.id,
          },
          session_id: `visitor-${slugify(name)}-${Date.now()}`,
          demo_mode: true,
        }),
      });
      if (!res.ok || !res.body) throw new Error('stream-fail');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) { full += parsed.text; setStreamBuffer(full); }
          } catch { full += data; setStreamBuffer(full); }
        }
      }
      if (full) {
        setMessages((prev) => [...prev, { role: 'mira', content: full }]);
      } else { throw new Error('empty'); }
    } catch {
      // Curated fallback — never let the visitor see a broken UI
      setMessages((prev) => [...prev, {
        role: 'mira',
        content: `Beautiful question about ${name}. Here's how I'd think about it:\n\n• Check ${name}'s profile, breed-specific risks, and recent context\n• Surface 2–3 best options across our 12 life pillars\n• Concierge® handles the actual booking or follow-up\n\n✨ With membership, your Concierge® is always one message away — every day of ${name}'s life.`,
      }]);
    } finally {
      setStreamBuffer('');
      setIsStreaming(false);
    }
  };

  const reset = () => {
    setView('form'); setName(''); setBreed(null); setAge(null);
    setMessages([]); setShowNudge(false); setShowCTA(false); setEmailSaved(false);
  };

  // ────────────────── RENDER ──────────────────
  if (view === 'mystique') return (
    <section
      data-testid="try-mira-section"
      style={{
        background: C.deep,
        padding: "80px clamp(20px,6vw,80px)",
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <MystiqueTribute onBack={() => setView('form')} />
    </section>
  );

  return (
    <section
      data-testid="try-mira-section"
      style={{
        background: C.deep,
        padding: "80px clamp(20px,6vw,80px)",
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: C.amber,
            letterSpacing: "0.14em", marginBottom: 14,
            fontFamily: "DM Sans, sans-serif",
          }}>
            ✨ TRY IT ON YOUR DOG · 60 SECONDS
          </div>
          <h2 style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "clamp(1.9rem,4.5vw,2.8rem)",
            fontWeight: 400, color: C.ivory, marginBottom: 12, lineHeight: 1.15,
          }}>
            Meet your dog through<br/>
            <em style={{ color: C.amber }}>Mira's eyes.</em>
          </h2>
          <p style={{ fontSize: 14, color: C.muted, marginBottom: 0 }}>
            No signup. No commitment. Just type your dog's name.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ── FORM VIEW ── */}
          {view === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              data-testid="try-mira-form"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                padding: "28px 24px",
              }}
            >
              {/* Name */}
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.1em', marginBottom: 8 }}>
                MY DOG'S NAME IS
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/,/g, '').slice(0, 30))}
                placeholder="e.g. Buddy"
                data-testid="try-mira-name-input"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  fontSize: 18,
                  color: C.ivory,
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  outline: 'none',
                  marginBottom: 24,
                }}
              />

              {/* Breed */}
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.1em', marginBottom: 8 }}>
                BREED
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {TOP_BREEDS.map((b) => {
                  const active = breed?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => { setBreed(b); setOtherDropdownOpen(false); }}
                      data-testid={`breed-chip-${b.id}`}
                      style={{
                        background: active ? C.amber : 'rgba(255,255,255,0.04)',
                        color: active ? C.deep : C.ivoryD,
                        border: `1px solid ${active ? C.amber : C.border}`,
                        borderRadius: 999,
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >{b.label}</button>
                  );
                })}
                <button
                  onClick={() => setOtherDropdownOpen(!otherDropdownOpen)}
                  data-testid="breed-chip-other"
                  style={{
                    background: breed && !TOP_BREEDS.some(b => b.id === breed.id) ? C.amber : 'rgba(255,255,255,0.04)',
                    color: breed && !TOP_BREEDS.some(b => b.id === breed.id) ? C.deep : C.ivoryD,
                    border: `1px solid ${breed && !TOP_BREEDS.some(b => b.id === breed.id) ? C.amber : C.border}`,
                    borderRadius: 999,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {breed && !TOP_BREEDS.some(b => b.id === breed.id) ? `${breed.label} ▾` : 'Other ▾'}
                </button>
              </div>

              {otherDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  data-testid="breed-other-dropdown"
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: 8,
                    marginBottom: 16,
                    overflow: 'hidden',
                  }}
                >
                  <input
                    type="text"
                    value={otherSearch}
                    onChange={(e) => setOtherSearch(e.target.value)}
                    placeholder="Search breeds…"
                    autoFocus
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12,
                      color: C.ivory,
                      outline: 'none',
                      marginBottom: 6,
                    }}
                  />
                  <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                    {filteredOther.map((b) => (
                      <button
                        key={b}
                        onClick={() => { setBreed({ id: slugify(b), label: b }); setOtherDropdownOpen(false); setOtherSearch(''); }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          background: 'transparent', border: 'none',
                          padding: '6px 10px', fontSize: 12,
                          color: C.ivoryD, cursor: 'pointer',
                          borderRadius: 6,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >{b}</button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Age */}
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: '0.1em', marginBottom: 8, marginTop: otherDropdownOpen ? 0 : 16 }}>
                AGE
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {AGES.map((a) => {
                  const active = age?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setAge(a)}
                      data-testid={`age-chip-${a.id}`}
                      style={{
                        background: active ? C.amber : 'rgba(255,255,255,0.04)',
                        color: active ? C.deep : C.ivoryD,
                        border: `1px solid ${active ? C.amber : C.border}`,
                        borderRadius: 999,
                        padding: '8px 14px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        flex: '1 1 90px',
                      }}
                    >
                      {a.label}<span style={{ opacity: 0.6, marginLeft: 4, fontSize: 11 }}>{a.months}</span>
                    </button>
                  );
                })}
              </div>

              {/* CTA */}
              <button
                onClick={startSoul}
                disabled={!isFormValid}
                data-testid="try-mira-submit"
                style={{
                  width: '100%',
                  background: isFormValid ? MIRA_ORB : 'rgba(255,255,255,0.08)',
                  color: isFormValid ? '#fff' : C.muted,
                  border: 'none',
                  borderRadius: 999,
                  padding: '14px 20px',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: isFormValid ? 'pointer' : 'not-allowed',
                  letterSpacing: '0.02em',
                }}
              >
                Try with {name.trim() || 'your dog'} →
              </button>

              {/* Example pets row */}
              <div style={{ marginTop: 22, textAlign: 'center', fontSize: 12, color: C.muted }}>
                Or try someone we know:
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
                <button onClick={() => tryExample('mojo')} data-testid="example-mojo" style={exampleBtnStyle()}>
                  🐾 Mojo
                </button>
                <button onClick={() => tryExample('mystique')} data-testid="example-mystique" style={exampleBtnStyle()}>
                  🌷 In memory of Mystique
                </button>
                <button onClick={() => tryExample('coco')} data-testid="example-coco" style={exampleBtnStyle()}>
                  🐕 Coco from Bangalore
                </button>
              </div>
            </motion.div>
          )}

          {/* ── SOUL CARD VIEW ── */}
          {view === 'soul' && (
            <motion.div
              key="soul"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              data-testid="try-mira-soul-card"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${C.border}`,
                borderRadius: 24,
                overflow: 'hidden',
              }}
            >
              {/* Header strip */}
              <div style={{
                background: "linear-gradient(135deg,#0F0A1E,#1A1040)",
                padding: "20px 24px",
                borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: MIRA_ORB,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>🐾</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: 22, color: C.ivory, fontWeight: 600,
                  }}>{name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {breed.label} · {age.label}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <motion.div
                    key={soulScore}
                    initial={{ scale: 1.2, color: C.amberL }}
                    animate={{ scale: 1, color: C.amber }}
                    transition={{ duration: 0.4 }}
                    style={{
                      fontFamily: "Cormorant Garamond, Georgia, serif",
                      fontSize: 32, fontWeight: 300, color: C.amber, lineHeight: 1,
                    }}
                  >{soulScore}%</motion.div>
                  <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.1em' }}>SOUL SCORE</div>
                </div>
                <button onClick={reset} data-testid="try-mira-reset" style={{
                  background: 'rgba(255,255,255,0.05)', border: 'none',
                  borderRadius: 16, padding: '4px 10px',
                  fontSize: 11, color: C.muted, cursor: 'pointer',
                }}>↺</button>
              </div>

              {/* Scenario tiles */}
              <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: '0.1em', fontWeight: 600 }}>
                  TRY ASKING:
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 6,
                }}>
                  {SCENARIOS_BY_AGE[age.id].map((s, i) => {
                    const text = s.text.replace(/\{name\}/g, name).replace(/\{breed\}/g, breed.label);
                    return (
                      <button
                        key={i}
                        onClick={() => sendMessage(text)}
                        data-testid={`scenario-${i}`}
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: '8px 10px',
                          fontSize: 11,
                          color: C.ivoryD,
                          textAlign: 'left',
                          cursor: 'pointer',
                          lineHeight: 1.3,
                        }}
                      >
                        <span style={{ marginRight: 4 }}>{s.emoji}</span>{text}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesRef} style={{
                height: 320, overflowY: 'auto',
                padding: '16px 18px', background: '#08060F',
              }}>
                {messages.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, marginBottom: 12,
                    flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                  }}>
                    {m.role === 'mira' && (
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: MIRA_ORB, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, color: '#fff',
                      }}>✦</div>
                    )}
                    <div style={{
                      maxWidth: '78%',
                      background: m.role === 'user' ? C.amber : 'rgba(155,89,182,0.12)',
                      border: m.role === 'user' ? 'none' : `1px solid ${C.border}`,
                      color: m.role === 'user' ? C.deep : C.ivory,
                      borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '10px 14px',
                      fontSize: 13, lineHeight: 1.6,
                    }}>
                      {m.role === 'user' ? m.content : <div>{renderSimpleMarkdown(m.content)}</div>}
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: MIRA_ORB, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: '#fff',
                    }}>✦</div>
                    <div style={{
                      background: 'rgba(155,89,182,0.12)',
                      border: `1px solid ${C.border}`,
                      borderRadius: '16px 16px 16px 4px',
                      padding: '10px 14px',
                      fontSize: 13, color: C.ivory, lineHeight: 1.6,
                    }}>
                      {streamBuffer ? <div>{renderSimpleMarkdown(streamBuffer)}<span style={{ color: C.amber, animation: 'pulse 1s infinite' }}>▊</span></div> : <span style={{ color: C.muted, fontStyle: 'italic' }}>Mira is thinking…</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Nudge / CTA stack */}
              <div style={{ padding: '0 16px' }}>
                {showNudge && !emailSaved && (
                  <SaveProfileNudge
                    name={name}
                    onSkip={() => setShowNudge(false)}
                    onSave={(email) => {
                      // Fire & forget — register the lead via existing endpoint or no-op
                      try {
                        fetch(`${API_URL}/api/leads/visitor-pet`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, pet_name: name, breed: breed.label, age: age.id, source: 'try-mira-landing' }),
                        }).catch(() => {});
                      } catch {}
                      setEmailSaved(true);
                      setShowNudge(false);
                    }}
                  />
                )}
                {showCTA && <MembershipCTA name={name} />}
              </div>

              {/* Input */}
              <div style={{
                padding: '12px 16px',
                borderTop: `1px solid rgba(255,255,255,0.05)`,
                background: '#0A0814',
              }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={`Ask Mira about ${name}…`}
                    data-testid="try-mira-chat-input"
                    style={{
                      flex: 1, minWidth: 0,
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${C.border}`,
                      borderRadius: 999,
                      padding: '10px 14px',
                      fontSize: 13,
                      color: C.ivory,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    data-testid="try-mira-chat-send"
                    style={{
                      background: MIRA_ORB,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 999,
                      padding: '10px 18px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >Send</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

const exampleBtnStyle = () => ({
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${C.border}`,
  borderRadius: 999,
  padding: '8px 14px',
  fontSize: 12,
  color: C.ivoryD,
  cursor: 'pointer',
  fontWeight: 500,
});

export default TryMiraOnYourDog;
