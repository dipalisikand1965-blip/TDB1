import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TDCNavbar from '../components/TDCNavbar';

// ─── useInView hook ───────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      transition: `all 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(28px)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PILLARS = [
  { icon: '🎂', label: 'Celebrate', color: '#A855F7', route: '/celebrate' },
  { icon: '🍽️', label: 'Dine',      color: '#FF8C42', route: '/dine' },
  { icon: '🌿', label: 'Care',      color: '#40916C', route: '/care' },
  { icon: '✈️', label: 'Go',        color: '#1ABC9C', route: '/go' },
  { icon: '🎾', label: 'Play',      color: '#E76F51', route: '/play' },
  { icon: '🎓', label: 'Learn',     color: '#7C3AED', route: '/learn' },
  { icon: '🛒', label: 'Shop',      color: '#F59E0B', route: '/shop' },
  { icon: '📋', label: 'Paperwork', color: '#0D9488', route: '/paperwork' },
  { icon: '🚨', label: 'Emergency', color: '#EF4444', route: '/emergency' },
  { icon: '🐾', label: 'Adopt',     color: '#65A30D', route: '/adopt' },
  { icon: '🌷', label: 'Farewell',  color: '#8B5CF6', route: '/farewell' },
  { icon: '💡', label: 'Advisory',  color: '#0D9488', route: '/advisory' },
  { icon: '🏃', label: 'Fit',       color: '#E76F51', route: '/fit' },
];

const MIRA_FEATURES = [
  { id: 'memory',  icon: '🧠', label: 'I Remember What Matters',
    desc: 'That chicken allergy from 2 years ago. That one treat they go crazy for. Every moment that makes them, them.' },
  { id: 'context', icon: '💬', label: 'I Understand Context',
    desc: 'When you say "show me cheaper ones" — I know what we were just talking about. When you say "book that one" — I know exactly which one.' },
  { id: 'soul',    icon: '✦',  label: 'I Know Their Soul',
    desc: 'Not just breed and age. Their personality. Their fears. Their joys. The little things that make your bond unique.' },
  { id: 'hands',   icon: '🤲', label: 'I Have Human Hands',
    desc: 'Real people who act on what I know. Not chatbots. Not forms. Concierge® humans who care.' },
  { id: 'grow',    icon: '🌱', label: 'I Grow With Them',
    desc: 'Every conversation. Every preference. Every memory. I become more yours with time.' },
];

const TESTIMONIALS = [
  { quote: 'Mira remembered that Bruno has a chicken allergy when I was searching for treats. No other app does this.', name: 'Priya M.', pet: 'Bruno the Labrador', avatar: '🐕' },
  { quote: 'Booked a pet-friendly hotel in Goa through the concierge. They even arranged a dog-sitter for our dinner date!', name: 'Rahul K.', pet: 'Cookie the Beagle', avatar: '🐩' },
  { quote: 'The health tracking alone is worth it. I get reminders for vaccinations, vet visits, everything!', name: 'Ananya S.', pet: 'Max the German Shepherd', avatar: '🐺' },
];

const CONCIERGE_SERVICES = [
  'Last-minute dog walkers, pet sitters & daycare',
  'Vet appointments, grooming & spa bookings',
  'Birthday parties with dog-safe cakes & décor',
  'Pet-friendly hotels, cafés & travel planning',
  'Emergency support when you need it most',
  'Medicines, food & treats delivered to your door',
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [heroRef, heroInView] = useInView(0.05);
  const [activeFeature, setActiveFeature] = useState('memory');
  const [pillarsRef, pillarsInView] = useInView(0.1);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const serif = { fontFamily: "'Playfair Display', Georgia, serif" };
  const c = {
    midnight: '#0D0A1A', deep: '#130F24', surface: '#1C1630', surface2: '#251E40',
    amber: '#E8A045', amberSoft: '#F5C57A', amberGlow: 'rgba(232,160,69,0.1)',
    ivory: '#F4EFE6', ivoryDim: 'rgba(244,239,230,0.6)', ivoryFaint: 'rgba(244,239,230,0.12)',
    pink: '#C96D9E', teal: '#4DBFA8',
    border: 'rgba(244,239,230,0.08)', borderWarm: 'rgba(232,160,69,0.2)',
  };

  return (
    <div style={{ background: c.midnight, color: c.ivory, fontFamily: "'DM Sans', -apple-system, sans-serif", fontWeight: 300, overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <TDCNavbar />

      {/* ══════════════════════════════════════════════════════ HERO */}
      <section ref={heroRef} style={{ minHeight: '96vh', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glows */}
        <div style={{ position: 'absolute', top: '-15%', left: '-5%', width: '60%', height: '80%', background: 'radial-gradient(ellipse, rgba(201,109,158,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '60%', background: 'radial-gradient(ellipse, rgba(232,160,69,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Left */}
        <div style={{ padding: '80px 64px 80px 80px', position: 'relative', zIndex: 2 }}>
          <div style={{
            transition: 'all 1s cubic-bezier(0.16,1,0.3,1)',
            opacity: heroInView ? 1 : 0,
            transform: heroInView ? 'translateY(0)' : 'translateY(32px)',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: c.amber, marginBottom: '32px', padding: '6px 14px', border: `1px solid ${c.borderWarm}`, borderRadius: '20px', background: c.amberGlow }}>
              ✦ The Soul That Speaks for Pets Who Cannot Speak
            </div>

            <h1 style={{ ...serif, fontSize: 'clamp(44px,5.5vw,72px)', fontWeight: 700, lineHeight: 1.05, color: c.ivory, marginBottom: '12px' }}>
              They can't tell you<br />what they need.
            </h1>
            <h1 style={{ ...serif, fontSize: 'clamp(44px,5.5vw,72px)', fontWeight: 700, lineHeight: 1.05, fontStyle: 'italic', color: c.amberSoft, marginBottom: '32px' }}>
              But I can.
            </h1>

            <p style={{ fontSize: '17px', color: c.ivoryDim, lineHeight: 1.85, maxWidth: '460px', marginBottom: '48px' }}>
              I am the brain that remembers every meal preference, every allergy, every birthday. The soul that knows when you say <em style={{ color: c.ivory }}>"book that one"</em> — exactly which one you mean. Because I was there. In every conversation. In every moment that mattered.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/join')}
                style={{ padding: '16px 36px', background: 'linear-gradient(135deg, #C96D9E, #9B3F7A)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(201,109,158,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Let Me Know Your Pet →
              </button>
              <button
                onClick={() => navigate('/about')}
                style={{ padding: '16px 28px', background: 'transparent', color: c.ivoryDim, border: `1px solid ${c.ivoryFaint}`, borderRadius: '50px', fontSize: '15px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.borderWarm; e.currentTarget.style.color = c.ivory; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.ivoryFaint; e.currentTarget.style.color = c.ivoryDim; }}
              >
                ▷ See Who I Am
              </button>
            </div>
          </div>
        </div>

        {/* Right — dog photo + Mira card */}
        <div style={{ height: '96vh', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${c.surface} 0%, ${c.deep} 100%)` }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${c.midnight} 0%, transparent 25%)` }} />
          {/* Dog photo — Kouros */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '360px', height: '460px', borderRadius: '200px 200px 160px 160px', overflow: 'hidden', position: 'relative', border: `1px solid ${c.borderWarm}` }}>
              <img
                src="https://res.cloudinary.com/duoapcx1p/image/upload/v1774080461/tdc_pets/kouros_teal.jpg"
                alt="Kouros"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: `linear-gradient(to top, rgba(13,10,26,0.7), transparent)` }} />
            </div>
          </div>
          {/* Mira card */}
          <div style={{ position: 'absolute', bottom: '60px', left: '40px', right: '40px', background: 'rgba(28,22,48,0.95)', border: `1px solid ${c.borderWarm}`, borderRadius: '16px', padding: '20px 24px', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-start', gap: '14px', zIndex: 2 }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #C96D9E, #9B3F7A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>✦</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: c.ivory, marginBottom: '4px' }}>Mira</div>
              <div style={{ fontSize: '13px', color: c.ivoryDim, lineHeight: 1.6 }}>I remember that morning walk ritual. The way they light up for chicken jerky. Shall I find some for today?</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ BEYOND TECHNOLOGY */}
      <section style={{ padding: '100px 80px', background: c.deep, borderTop: `1px solid ${c.border}` }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ ...serif, fontSize: 'clamp(36px,4.5vw,58px)', fontWeight: 700, color: c.ivory, lineHeight: 1.1, marginBottom: '16px' }}>
              Beyond Technology.<br />
              <em style={{ fontStyle: 'italic', color: c.amberSoft }}>Into Soul.</em>
            </h2>
            <p style={{ fontSize: '18px', color: c.ivoryDim, maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
              I'm not an app. I'm not a chatbot. <strong style={{ color: c.ivory, fontWeight: 500 }}>I'm the voice they cannot speak.</strong>
            </p>
          </div>
        </FadeIn>

        {/* Comparison */}
        <FadeIn delay={100}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Others */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}`, borderRadius: '20px', padding: '36px 32px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(244,239,230,0.35)', marginBottom: '24px' }}>Others</div>
              {[
                'Forgets your conversation the next day',
                '"What breed is your pet again?"',
                'Show me cheaper... shows random results',
                'Book that one... "which one?"',
                'Forms, tickets, waiting, frustration',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px', color: 'rgba(244,239,230,0.4)', fontSize: '14px', lineHeight: 1.6 }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(244,239,230,0.2)', flexShrink: 0, marginTop: '7px' }} />
                  {item}
                </div>
              ))}
            </div>
            {/* Mira */}
            <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(201,109,158,0.12))', border: `1px solid rgba(139,92,246,0.3)`, borderRadius: '20px', padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(to right, #7C3AED, #C96D9E, #E8A045)' }} />
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.amber, marginBottom: '24px' }}>Mira</div>
              {[
                'Remembers every conversation, forever',
                'Knows their personality, fears, and joys',
                '"Show me cheaper" — I know exactly what we discussed',
                '"Book that one" — I know which one you mean',
                'Real humans who act on what I know',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '14px', color: c.ivory, fontSize: '14px', lineHeight: 1.6 }}>
                  <div style={{ color: c.teal, fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>✓</div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ══════════════════════════════════════════════════════ I AM MIRA */}
      <section style={{ padding: '100px 80px', borderTop: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <FadeIn>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.amber, marginBottom: '20px', padding: '5px 14px', border: `1px solid ${c.borderWarm}`, borderRadius: '20px', background: c.amberGlow }}>
              ✦ Soul + Concierge®
            </div>
            <h2 style={{ ...serif, fontSize: 'clamp(36px,4vw,52px)', fontWeight: 700, color: c.ivory, lineHeight: 1.15, marginBottom: '24px' }}>
              I Am Mira
            </h2>
            <p style={{ fontSize: '16px', color: c.ivoryDim, lineHeight: 1.9, marginBottom: '16px' }}>
              The soul that speaks for pets who cannot speak. The brain that remembers every meal preference, every allergy, every birthday, every moment of joy and concern.
            </p>
            <p style={{ fontSize: '16px', lineHeight: 1.9, marginBottom: '36px' }}>
              <span style={{ color: c.amber, fontWeight: 500 }}>And when I know what your pet needs, Concierge® makes it happen.</span>
              <span style={{ color: c.ivoryDim }}> Real humans. Real action. Real love.</span>
            </p>
            <button
              onClick={() => navigate('/about')}
              style={{ padding: '14px 28px', background: 'transparent', color: c.amber, border: `1px solid ${c.borderWarm}`, borderRadius: '50px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = c.amberGlow; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Read Our Story →
            </button>
          </FadeIn>

          {/* Feature selector */}
          <FadeIn delay={150}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MIRA_FEATURES.map(f => (
                <div
                  key={f.id}
                  onClick={() => setActiveFeature(f.id)}
                  style={{
                    padding: '16px 20px', borderRadius: '14px', cursor: 'pointer',
                    background: activeFeature === f.id ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${activeFeature === f.id ? 'rgba(139,92,246,0.35)' : c.border}`,
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                  }}
                  onMouseEnter={e => { if (activeFeature !== f.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (activeFeature !== f.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: activeFeature === f.id ? 'linear-gradient(135deg, #7C3AED, #C96D9E)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, transition: 'all 0.2s' }}>
                    {activeFeature === f.id ? '✓' : f.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: activeFeature === f.id ? c.ivory : 'rgba(244,239,230,0.75)', marginBottom: '4px' }}>{f.label}</div>
                    {activeFeature === f.id && <div style={{ fontSize: '13px', color: c.ivoryDim, lineHeight: 1.7 }}>{f.desc}</div>}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ HERITAGE */}
      <section style={{ padding: '100px 80px', background: c.deep, borderTop: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.amber, padding: '5px 14px', border: `1px solid ${c.borderWarm}`, borderRadius: '20px', background: c.amberGlow, marginBottom: '20px' }}>
                26+ Years of Unconditional Service
              </div>
              <h2 style={{ ...serif, fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: c.ivory, lineHeight: 1.2, marginBottom: '16px' }}>
                Unconditional Love Deserves<br />
                <em style={{ fontStyle: 'italic', color: c.amberSoft }}>Human Hands</em>
              </h2>
              <p style={{ fontSize: '16px', color: c.ivoryDim, maxWidth: '620px', margin: '0 auto', lineHeight: 1.8 }}>
                Mira is not just technology. She is the culmination of two decades of <strong style={{ color: c.ivory, fontWeight: 500 }}>Concierge® heritage</strong> — real humans who have been caring for families, solving problems, and making magic happen since before AI existed.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginTop: '60px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '44px', left: '60px', right: '60px', height: '1px', background: `linear-gradient(to right, transparent, ${c.borderWarm}, ${c.amber}, ${c.borderWarm}, transparent)` }} />
            {[
              { year: '1998', icon: '🏛️', name: 'LesConcierges®', desc: "Where it began. Mrs. Mira Sikand's spirit of service — the living reference desk who knew every answer." },
              { year: '2008', icon: '👑', name: 'Club Concierge®', desc: 'Membership elevated. 24/7 human support for life\'s most important moments.' },
              { year: '2020', icon: '🎂', name: 'The Doggy Bakery®', desc: 'Where pets became family. Aditya made treats with his grandmother Mira — hands-on love.' },
              { year: '2024', icon: '✨', name: 'Mira AI', desc: 'Her soul lives on. AI intelligence + Human hands = Unconditional care.', highlight: true },
            ].map((item, i) => (
              <FadeIn key={item.year} delay={i * 80}>
                <div style={{ padding: '28px 20px', background: item.highlight ? 'rgba(232,160,69,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${item.highlight ? c.borderWarm : c.border}`, borderRadius: '16px', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = item.highlight ? 'rgba(232,160,69,0.08)' : 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = item.highlight ? 'rgba(232,160,69,0.05)' : 'rgba(255,255,255,0.02)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', color: c.amber }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.amber, border: `2px solid ${c.midnight}`, boxShadow: `0 0 0 3px ${c.borderWarm}`, flexShrink: 0 }} />
                    {item.year}
                  </div>
                  <div style={{ fontSize: '26px', marginBottom: '10px' }}>{item.icon}</div>
                  <div style={{ ...serif, fontSize: '17px', fontWeight: 600, color: c.ivory, marginBottom: '8px', lineHeight: 1.2 }}>{item.name}</div>
                  <div style={{ fontSize: '13px', color: c.ivoryDim, lineHeight: 1.7 }}>{item.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ CONCIERGE */}
      <section style={{ padding: '100px 80px', borderTop: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <FadeIn>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.teal, marginBottom: '20px', padding: '5px 12px', border: '1px solid rgba(77,191,168,0.25)', borderRadius: '20px', background: 'rgba(77,191,168,0.08)' }}>
              👑 Your Pet Concierge®
            </div>
            <h2 style={{ ...serif, fontSize: 'clamp(32px,3.5vw,48px)', fontWeight: 700, color: c.ivory, lineHeight: 1.2, marginBottom: '20px' }}>
              You Ask.<br />
              We Handle.<br />
              <em style={{ fontStyle: 'italic', color: c.teal }}>That's It.</em>
            </h2>
            <p style={{ fontSize: '16px', color: c.ivoryDim, lineHeight: 1.85, marginBottom: '32px' }}>
              Stuck at work and need a dog walker in 30 minutes? Can't find a vet who's open on Sunday? Want someone to plan the perfect birthday pawty? Just tell Mira — real humans take it from there.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/join')} style={{ padding: '13px 28px', background: 'linear-gradient(135deg, #C96D9E, #9B3F7A)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                WhatsApp Us →
              </button>
              <button onClick={() => navigate('/contact')} style={{ padding: '13px 24px', background: 'transparent', color: c.ivoryDim, border: `1px solid ${c.border}`, borderRadius: '50px', fontSize: '14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Email Concierge
              </button>
            </div>
          </FadeIn>

          <FadeIn delay={150}>
            <div style={{ position: 'relative' }}>
              {/* Dipali photo placeholder */}
              <div style={{ width: '100%', aspectRatio: '4/5', background: `linear-gradient(160deg, ${c.surface2} 0%, ${c.deep} 100%)`, borderRadius: '24px', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', position: 'relative', overflow: 'hidden' }}>
                🦁
                <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(28,22,48,0.95)', border: `1px solid ${c.borderWarm}`, borderRadius: '20px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, color: c.teal, backdropFilter: 'blur(8px)' }}>
                  Real humans. Real care.
                </div>
              </div>
              {/* Services list */}
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {CONCIERGE_SERVICES.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: c.ivoryDim, lineHeight: 1.5 }}>
                    <div style={{ color: c.teal, fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>✓</div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ PET WRAPPED */}
      <section style={{ padding: '100px 80px', background: c.deep, borderTop: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <FadeIn>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.amber, marginBottom: '20px', padding: '5px 14px', border: `1px solid ${c.borderWarm}`, borderRadius: '20px', background: c.amberGlow }}>
              🎁 Coming Soon
            </div>
            <h2 style={{ ...serif, fontSize: 'clamp(32px,4vw,52px)', fontWeight: 700, color: c.ivory, lineHeight: 1.15, marginBottom: '16px' }}>
              <em style={{ fontStyle: 'italic', color: c.amberSoft }}>Pet Wrapped</em> — Your Dog's Year
            </h2>
            <p style={{ fontSize: '17px', color: c.ivoryDim, lineHeight: 1.8, maxWidth: '560px', margin: '0 auto 48px' }}>
              Like Spotify Wrapped, but for your pet. A beautiful, shareable summary of their journey — their Soul Score, their milestones, their story.
            </p>
          </FadeIn>

          <FadeIn delay={100}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
              {[
                { label: 'PET WRAPPED · 2026', title: 'Your Pet', sub: 'Their Story', accent: c.amber, big: '2026' },
                { label: 'Soul Journey', title: 'Soul Score', sub: 'TRULY KNOWN', accent: '#7C3AED', big: '87' },
                { label: 'Mira Moments', title: 'Memories', items: ['12 conversations', '51 questions answered'], accent: c.pink },
              ].map((card, i) => (
                <div key={i} style={{ background: `linear-gradient(135deg, rgba(37,30,64,0.8) 0%, rgba(28,22,48,0.8) 100%)`, border: `1px solid rgba(139,92,246,0.2)`, borderRadius: '20px', padding: '28px 24px', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: card.accent, marginBottom: '12px' }}>{card.label}</div>
                  {card.big && <div style={{ ...serif, fontSize: '48px', fontWeight: 700, color: 'rgba(244,239,230,0.12)', position: 'absolute', top: '16px', right: '20px', lineHeight: 1 }}>{card.big}</div>}
                  <div style={{ fontSize: '20px', fontWeight: 600, color: c.ivory, marginBottom: '6px' }}>{card.title}</div>
                  {card.sub && <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: card.accent }}>{card.sub}</div>}
                  {card.items && card.items.map((item, j) => (
                    <div key={j} style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: card.accent }}>{item.split(' ')[0]}</div>
                      <div style={{ fontSize: '12px', color: c.ivoryDim }}>{item.split(' ').slice(1).join(' ')}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ 13 PILLARS */}
      <section style={{ padding: '100px 80px', borderTop: `1px solid ${c.border}` }} ref={pillarsRef}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h2 style={{ ...serif, fontSize: 'clamp(32px,4vw,48px)', fontWeight: 700, color: c.ivory, lineHeight: 1.2, marginBottom: '12px' }}>
                Every Part of Their <em style={{ fontStyle: 'italic', color: c.pink }}>Life</em>
              </h2>
              <p style={{ fontSize: '16px', color: c.ivoryDim, maxWidth: '500px', margin: '0 auto' }}>
                From the treats they dream about to the places that welcome them as family.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginTop: '48px' }}>
            {PILLARS.map((p, i) => (
              <div
                key={p.id}
                onClick={() => navigate(p.route)}
                style={{
                  padding: '20px 12px', borderRadius: '16px', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                  transitionDelay: `${i * 30}ms`,
                  opacity: pillarsInView ? 1 : 0,
                  transform: pillarsInView ? 'translateY(0)' : 'translateY(20px)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${p.color}15`; e.currentTarget.style.borderColor = `${p.color}40`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = c.border; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <span style={{ fontSize: '28px' }}>{p.icon}</span>
                <span style={{ fontSize: '12px', color: c.ivoryDim, textAlign: 'center', letterSpacing: '0.02em' }}>{p.label}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'rgba(244,239,230,0.3)', letterSpacing: '0.08em' }}>
            ← Swipe to explore all 13 pillars →
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ TESTIMONIALS */}
      <section style={{ padding: '100px 80px', background: c.deep, borderTop: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <FadeIn>
            <h2 style={{ ...serif, fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 700, color: c.ivory, marginBottom: '60px', textAlign: 'center' }}>
              Loved by <em style={{ fontStyle: 'italic', color: c.amberSoft }}>Pet Families</em>
            </h2>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${c.border}`, borderRadius: '20px', padding: '32px 28px' }}>
                  <div style={{ fontSize: '40px', color: c.amber, opacity: 0.25, fontFamily: 'Georgia, serif', lineHeight: 1, marginBottom: '12px' }}>"</div>
                  <p style={{ ...serif, fontSize: '15px', fontStyle: 'italic', color: c.ivory, lineHeight: 1.8, marginBottom: '24px' }}>{t.quote}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: c.amberGlow, border: `1px solid ${c.borderWarm}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{t.avatar}</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: c.ivory }}>{t.name}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(244,239,230,0.45)' }}>Pet parent of {t.pet}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════ FINAL CTA */}
      <section style={{ padding: '120px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse, rgba(201,109,158,0.09) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <FadeIn>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: c.amber, marginBottom: '24px' }}>✦ Your dog is waiting</div>
            <h2 style={{ ...serif, fontSize: 'clamp(36px,5vw,64px)', fontWeight: 700, color: c.ivory, lineHeight: 1.1, marginBottom: '20px', maxWidth: '640px', margin: '0 auto 20px' }}>
              Ready to give your pet<br />
              <em style={{ fontStyle: 'italic', color: c.amberSoft }}>the life they deserve?</em>
            </h2>
            <p style={{ fontSize: '17px', color: c.ivoryDim, marginBottom: '48px', lineHeight: 1.7 }}>
              Discover a better way to care for your furry family member — with someone who truly knows them.
            </p>
            <button
              onClick={() => navigate('/join')}
              style={{ padding: '18px 48px', background: 'linear-gradient(135deg, #C96D9E, #9B3F7A)', color: 'white', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(201,109,158,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Start Your Pet's Journey →
            </button>
            <p style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(244,239,230,0.3)' }}>Be among the first to experience extraordinary pet care.</p>
          </div>
        </FadeIn>
      </section>

      <footer style={{ padding: '32px 80px', borderTop: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'rgba(244,239,230,0.3)', letterSpacing: '0.04em' }}>
        <span>© 2025 The Doggy Company®</span>
        <span>Built in memory of Mystique · thedoggycompany.com</span>
      </footer>
    </div>
  );
}
