/**
 * DemoPage.jsx — /demo
 * The Doggy Company — Experience
 *
 * Public, standalone. No auth. No navbar from the main app.
 * Deep midnight luxury editorial.
 *
 * Sections:
 *   1. Hero — tagline + "Every dog has a soul"
 *   2. Three Truths — Google / Amazon / TDC
 *   3. Mira — "The world's first Pet Life OS"
 *   4. Mojo's Soul Card — live interactive profile
 *   5. 12 Pillars Grid
 *   6. Stats — animated counters
 *   7. Waitlist CTA + Mystique footer
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// CSS injected into <head> via useEffect — never as JSX <style> in body
const DEMO_CSS = `
  .demo-pillars {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }
  .demo-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 40px;
    max-width: 860px;
    margin: 0 auto;
  }
  .demo-soul-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .demo-three-truths { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px; }
  .demo-nav-links { display: flex; align-items: center; gap: 16px; }
  .demo-hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 8px; z-index: 102; }
  .demo-hamburger span { width: 22px; height: 2px; background: #F5F0E8; border-radius: 2px; transition: all 0.3s; }
  .demo-mobile-menu {
    position: fixed; top: 0; right: 0; bottom: 0; width: 260px;
    z-index: 101; background: rgba(26,10,46,0.97);
    backdrop-filter: blur(16px); padding: 80px 28px 40px;
    display: flex; flex-direction: column; gap: 4px;
    transform: translateX(100%); transition: transform 0.3s ease;
    border-left: 1px solid rgba(201,151,58,0.18);
  }
  .demo-mobile-menu.open { transform: translateX(0); }
  .demo-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.5); opacity: 0; pointer-events: none; transition: opacity 0.3s; }
  .demo-overlay.open { opacity: 1; pointer-events: auto; }
  @keyframes demo-orbPulse {
    0%, 100% { box-shadow: 0 0 40px rgba(155,89,182,0.3), 0 0 80px rgba(155,89,182,0.1); }
    50%       { box-shadow: 0 0 60px rgba(155,89,182,0.5), 0 0 120px rgba(155,89,182,0.2); }
  }
  @keyframes demo-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes demo-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
  .demo-mira-orb { animation: demo-orbPulse 3s ease-in-out infinite, demo-float 6s ease-in-out infinite; }
  .demo-amber-shimmer {
    background: linear-gradient(90deg, #C9973A 0%, #E8B84B 40%, #C9973A 80%);
    background-size: 200%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; animation: demo-shimmer 3s linear infinite;
  }
  ::selection { background: rgba(201,151,58,0.3); }
  @media (max-width: 900px) {
    .demo-pillars { grid-template-columns: repeat(3, 1fr); }
    .demo-stats   { grid-template-columns: repeat(2, 1fr); gap: 24px; }
    .demo-three-truths { grid-template-columns: 1fr; gap: 12px; }
  }
  @media (max-width: 640px) {
    .demo-pillars { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .demo-stats   { grid-template-columns: repeat(2, 1fr); gap: 20px; }
    .demo-nav-links > *:not(:last-child) { display: none; }
    .demo-hamburger { display: flex; }
  }
  @media (max-width: 480px) { .demo-pillars { grid-template-columns: repeat(2, 1fr); } }
`;

const C = {
  bg:      "#1A0A2E",
  bgDeep:  "#12071F",
  bgCard:  "rgba(255,255,255,0.035)",
  amber:   "#C9973A",
  amberL:  "#E8B84B",
  ivory:   "#F5F0E8",
  ivoryD:  "#D4C9B0",
  muted:   "rgba(245,240,232,0.52)",
  mutedD:  "rgba(245,240,232,0.30)",
  border:  "rgba(201,151,58,0.18)",
  borderS: "rgba(255,255,255,0.07)",
  purple:  "#9B59B6",
  purpleL: "rgba(155,89,182,0.15)",
  alert:   "rgba(220,38,38,0.12)",
  alertB:  "rgba(220,38,38,0.35)",
  green:   "rgba(39,174,96,0.09)",
  greenB:  "rgba(39,174,96,0.26)",
};

const MIRA_ORB = "linear-gradient(135deg,#9B59B6 0%,#E91E8C 60%,#FF6EC7 100%)";

// ─── Animated fade-in on scroll ────────────────────────────────────────
function FadeIn({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold: 0.08 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Animated counter ───────────────────────────────────────────────────
function Counter({ target, suffix = "", prefix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const step = target / 60;
        let n = 0;
        const t = setInterval(() => {
          n = Math.min(n + step, target);
          setCount(Math.floor(n));
          if (n >= target) clearInterval(t);
        }, 16);
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// ─── Section label ──────────────────────────────────────────────────────
function SLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: C.amber,
      letterSpacing: "0.16em", marginBottom: 20,
      fontFamily: "DM Sans, sans-serif",
      textTransform: "uppercase",
    }}>
      {children}
    </div>
  );
}

// ─── Allergy chip ───────────────────────────────────────────────────────
function AllergyChip({ label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: C.alert, border: `1.5px solid ${C.alertB}`,
      borderRadius: 999, padding: "5px 13px",
      fontSize: 12, fontWeight: 700, color: "#F87171",
      fontFamily: "DM Sans, sans-serif",
      letterSpacing: "0.01em",
    }}>
      ✗ No {label}
    </span>
  );
}

// ─── Love chip ──────────────────────────────────────────────────────────
function LoveChip({ label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: C.green, border: `1.5px solid ${C.greenB}`,
      borderRadius: 999, padding: "5px 13px",
      fontSize: 12, fontWeight: 600, color: "#1E7A46",
      fontFamily: "DM Sans, sans-serif",
    }}>
      ♥ {label}
    </span>
  );
}

// ─── Soul trait chip ────────────────────────────────────────────────────
function TraitChip({ icon, label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "rgba(155,89,182,0.10)", border: "1px solid rgba(155,89,182,0.22)",
      borderRadius: 999, padding: "5px 13px",
      fontSize: 12, fontWeight: 600, color: C.ivoryD,
      fontFamily: "DM Sans, sans-serif",
    }}>
      {icon} {label}
    </span>
  );
}

// ─── Pillar card ────────────────────────────────────────────────────────
function PillarCard({ icon, label, colour, desc }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? `${colour}12` : C.bgCard,
        border: `1px solid ${hov ? colour + "40" : C.borderS}`,
        borderRadius: 18, padding: "20px 18px",
        cursor: "default",
        transition: "all 0.25s ease",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? `0 8px 30px ${colour}18` : "none",
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{
        fontFamily: "Cormorant Garamond, Georgia, serif",
        fontSize: 17, fontWeight: 600, color: hov ? C.ivory : C.ivoryD,
        marginBottom: 6, transition: "color 0.2s",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 11.5, color: C.mutedD,
        fontFamily: "DM Sans, sans-serif",
        lineHeight: 1.5,
      }}>
        {desc}
      </div>
    </div>
  );
}

// ─── Main export ────────────────────────────────────────────────────────
export default function DemoPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Inject CSS into <head> — never as JSX <style> in body (avoids removeChild errors)
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "demo-page-styles";
    el.textContent = DEMO_CSS;
    document.head.appendChild(el);
    return () => { if (document.head.contains(el)) document.head.removeChild(el); };
  }, []);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const handleWaitlist = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  const PILLARS = [
    { icon:"🍽️", label:"Dine",       colour:"#C9973A", desc:"Nutrition, meals & treats curated to their gut, breed, and allergies." },
    { icon:"🌿", label:"Care",       colour:"#40916C", desc:"Grooming, wellness & daily health — personalised to their coat and quirks." },
    { icon:"✈️", label:"Go",         colour:"#1D9E75", desc:"Travel, stays & adventures — matched to their travel temperament." },
    { icon:"🎾", label:"Play",       colour:"#E76F51", desc:"Activity, enrichment & social life — tuned to their energy level." },
    { icon:"🎓", label:"Learn",      colour:"#7C3AED", desc:"Training, discovery & enrichment — at exactly their learning stage." },
    { icon:"🎂", label:"Celebrate",  colour:"#9B59B6", desc:"Birthdays, Gotcha Days, festivals — rituals that honour their soul." },
    { icon:"🛍️", label:"Shop",       colour:"#B45309", desc:"Curated products, ranked by Mira for their specific profile." },
    { icon:"📄", label:"Paperwork",  colour:"#0F6E56", desc:"Vet records, insurance & docs — all in one place, always ready." },
    { icon:"🚨", label:"Emergency",  colour:"#DC2626", desc:"Nearest help, protocols & calm — because seconds matter." },
    { icon:"🐾", label:"Adopt",      colour:"#7B3FA0", desc:"The right match — not just any dog, the dog made for your family." },
    { icon:"🌷", label:"Farewell",   colour:"#334155", desc:"Rainbow Bridge & remembrance — because love doesn't end." },
    { icon:"🤝", label:"Services",   colour:"#1D9E75", desc:"Expert concierge — vets, groomers, trainers on demand." },
  ];

  const STATS = [
    { target: 1247, suffix: "+", label: "Dogs on the platform" },
    { target: 12,   suffix: "",  label: "Life pillars covered" },
    { target: 97,   suffix: "%", label: "Soul match accuracy" },
    { target: 286,  suffix: "+", label: "Expert services curated" },
  ];

  const MOJO = {
    name: "Mojo",
    breed: "Indie",
    lifeStage: "Senior",
    words: ["Playful", "Loyal", "Energetic"],
    allergies: ["Chicken", "Beef"],
    loves: ["Wild Salmon", "Peanut Butter"],
    energy: "High energy",
    temperament: "Friendly & loves everyone",
    celebrations: ["Birthday", "Gotcha Day", "Diwali", "Holi", "Christmas"],
    sleep: "Your bed",
    dream: "Happy, joyful life",
    wish: "Good health",
  };

  return (
    <div style={{
      background: C.bg, color: C.ivory,
      fontFamily: "DM Sans, sans-serif",
      overflowX: "hidden", minHeight: "100vh",
    }}>
      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "16px clamp(20px,5vw,60px)",
        background: scrolled ? "rgba(26,10,46,0.94)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "none",
        transition: "all 0.3s",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate("/")}
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: 20, fontWeight: 600, color: C.ivory,
            letterSpacing: "0.02em", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          The Doggy Company
          <span style={{ color: C.amber }}>®</span>
        </div>

        {/* Desktop nav */}
        <div className="demo-nav-links">
          <button onClick={() => navigate("/about")} style={{
            background: "none", border: "none", color: C.muted,
            fontSize: 14, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
          }}>
            Our Story
          </button>
          <button onClick={() => navigate("/membership")} style={{
            background: "none", border: "none", color: C.muted,
            fontSize: 14, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
          }}>
            Membership
          </button>
          <button
            onClick={() => navigate("/join")}
            data-testid="demo-cta-nav"
            style={{
              padding: "9px 22px", borderRadius: 999,
              border: `1px solid ${C.amber}`, background: "transparent",
              color: C.amber, fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "DM Sans, sans-serif",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.amber; e.currentTarget.style.color = C.bgDeep; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.amber; }}
          >
            Get early access
          </button>
        </div>

        {/* Hamburger */}
        <div className="demo-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} data-testid="demo-mobile-menu">
          <span style={mobileMenuOpen ? { transform: "rotate(45deg) translate(5px,5px)" } : {}} />
          <span style={mobileMenuOpen ? { opacity: 0 } : {}} />
          <span style={mobileMenuOpen ? { transform: "rotate(-45deg) translate(5px,-5px)" } : {}} />
        </div>
      </nav>

      {/* Mobile overlay & menu */}
      <div className={`demo-overlay${mobileMenuOpen ? " open" : ""}`} onClick={() => setMobileMenuOpen(false)} />
      <div className={`demo-mobile-menu${mobileMenuOpen ? " open" : ""}`}>
        {[
          { label: "Our Story", action: () => navigate("/about") },
          { label: "Membership", action: () => navigate("/membership") },
          { label: "Sign in", action: () => navigate("/login") },
        ].map(item => (
          <button key={item.label} onClick={() => { setMobileMenuOpen(false); item.action(); }} style={{
            background: "none", border: "none", textAlign: "left",
            color: C.ivory, fontSize: 18, fontWeight: 500,
            padding: "14px 0", fontFamily: "DM Sans, sans-serif",
            cursor: "pointer", borderBottom: `1px solid ${C.border}`,
          }}>
            {item.label}
          </button>
        ))}
        <button onClick={() => { setMobileMenuOpen(false); navigate("/join"); }} style={{
          marginTop: 24, padding: "14px 28px", borderRadius: 999,
          border: `1px solid ${C.amber}`, background: C.amber,
          color: C.bgDeep, fontSize: 16, fontWeight: 600,
          cursor: "pointer", fontFamily: "DM Sans, sans-serif",
        }}>
          Get early access
        </button>
      </div>

      {/* ── SECTION 1: HERO ─────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse at 20% 40%, rgba(155,89,182,0.18) 0%, transparent 55%),
                     radial-gradient(ellipse at 80% 70%, rgba(201,151,58,0.10) 0%, transparent 50%),
                     ${C.bg}`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px clamp(20px,6vw,80px) 80px",
        textAlign: "center", position: "relative",
      }}>
        {/* Ambient glow orbs */}
        <div style={{
          position: "absolute", top: "15%", left: "8%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(155,89,182,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "20%", right: "5%",
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,151,58,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Label */}
        <FadeIn>
          <div style={{
            fontSize: 10, fontWeight: 700, color: C.amber,
            letterSpacing: "0.22em", marginBottom: 28,
            fontFamily: "DM Sans, sans-serif",
            border: `1px solid ${C.border}`,
            padding: "6px 18px", borderRadius: 999,
            display: "inline-block",
          }}>
            THE DOGGY COMPANY — EXPERIENCE
          </div>
        </FadeIn>

        {/* Hero headline */}
        <FadeIn delay={0.1}>
          <h1 style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "clamp(2.8rem,7vw,5.5rem)",
            fontWeight: 400, lineHeight: 1.1,
            color: C.ivory, maxWidth: 780, margin: "0 auto 10px",
            letterSpacing: "-0.01em",
          }}>
            Every dog has a soul.
          </h1>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h2 style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "clamp(1.6rem,4vw,2.8rem)",
            fontWeight: 300, lineHeight: 1.35,
            color: C.ivoryD, maxWidth: 680, margin: "0 auto 24px",
            letterSpacing: "0.01em", fontStyle: "italic",
          }}>
            For the first time in the world —<br />
            a platform that knows it.
          </h2>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p style={{
            fontSize: "clamp(14px,2.2vw,17px)",
            color: C.muted, maxWidth: 520, margin: "0 auto 44px",
            lineHeight: 1.75, fontFamily: "DM Sans, sans-serif",
          }}>
            Mira knows Mojo cannot have chicken — ever.
            She knows his birthday is in Q4, he loves salmon treats,
            and his dream is a happy, joyful life.{" "}
            <em style={{ color: C.ivoryD }}>That's not a database. That's a soul.</em>
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              data-testid="demo-hero-early-access"
              onClick={() => navigate("/join")}
              style={{
                padding: "15px 36px", borderRadius: 999,
                background: C.amber, border: "none",
                color: C.bgDeep, fontSize: 15, fontWeight: 700,
                cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                transition: "all 0.25s",
                boxShadow: `0 4px 24px ${C.amber}40`,
                letterSpacing: "0.02em",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${C.amber}55`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 4px 24px ${C.amber}40`; }}
            >
              Request early access
            </button>
            <button
              data-testid="demo-hero-see-mojo"
              onClick={() => { document.getElementById("mojo-soul-card")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{
                padding: "15px 36px", borderRadius: 999,
                border: `1px solid ${C.borderS}`, background: "rgba(255,255,255,0.04)",
                color: C.ivory, fontSize: 15, fontWeight: 500,
                cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                transition: "all 0.25s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.amber + "50"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderS; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            >
              See Mojo's story →
            </button>
          </div>
        </FadeIn>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          opacity: 0.4,
        }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: C.muted, fontFamily: "DM Sans, sans-serif" }}>SCROLL</div>
          <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${C.amber}, transparent)` }} />
        </div>
      </section>

      {/* ── SECTION 2: THREE TRUTHS ──────────────────────────────────────── */}
      <section style={{
        padding: "80px clamp(20px,6vw,80px)",
        background: C.bgDeep,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <FadeIn>
            <SLabel>The world has changed</SLabel>
          </FadeIn>
          <div className="demo-three-truths" style={{ gap: "2px" }}>
            {[
              {
                tag: "GOOGLE",
                verb: "suggests.",
                color: "#4285F4",
                desc: "Millions of results. None know your dog's name.",
                bg: "rgba(66,133,244,0.06)",
                border: "rgba(66,133,244,0.15)",
              },
              {
                tag: "AMAZON",
                verb: "sells.",
                color: "#FF9900",
                desc: "Millions of products. None filtered for Mojo's chicken allergy.",
                bg: "rgba(255,153,0,0.06)",
                border: "rgba(255,153,0,0.15)",
              },
              {
                tag: "THE DOGGY COMPANY",
                verb: "does.",
                color: C.amber,
                desc: "Knows your dog's soul. Acts on it.",
                bg: C.purpleL,
                border: C.border,
                highlight: true,
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div style={{
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                  borderRadius: i === 0 ? "18px 0 0 18px" : i === 2 ? "0 18px 18px 0" : "0",
                  padding: "32px 28px",
                  transition: "all 0.25s",
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
                    color: item.color, marginBottom: 10,
                    fontFamily: "DM Sans, sans-serif",
                  }}>
                    {item.tag}
                  </div>
                  <div style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: "clamp(1.8rem,3.5vw,2.8rem)",
                    fontWeight: item.highlight ? 600 : 400,
                    color: item.highlight ? C.ivory : C.ivoryD,
                    marginBottom: 12, lineHeight: 1.1,
                  }}>
                    {item.verb}
                  </div>
                  <div style={{
                    fontSize: 13, color: C.muted,
                    fontFamily: "DM Sans, sans-serif", lineHeight: 1.6,
                  }}>
                    {item.desc}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3}>
            <div style={{
              marginTop: 32, textAlign: "center",
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "clamp(1.1rem,2.5vw,1.7rem)",
              color: C.ivoryD, fontStyle: "italic",
              letterSpacing: "0.02em",
            }}>
              "For the first time.{" "}
              <span className="demo-amber-shimmer">Anywhere.</span>"
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── SECTION 3: MIRA ──────────────────────────────────────────────── */}
      <section style={{
        padding: "100px clamp(20px,6vw,80px)",
        maxWidth: 820, margin: "0 auto",
        textAlign: "center",
      }}>
        <FadeIn>
          <div
            className="demo-mira-orb"
            style={{
              width: 80, height: 80, borderRadius: "50%",
              background: MIRA_ORB,
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 32,
              color: "#fff", margin: "0 auto 32px",
            }}
          >
            ✦
          </div>
          <SLabel>Introducing Mira</SLabel>
          <h2 style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "clamp(2rem,5vw,3.8rem)",
            fontWeight: 400, color: C.ivory,
            marginBottom: 20, lineHeight: 1.15,
          }}>
            Meet Mira —<br />
            <span style={{ fontStyle: "italic", color: C.ivoryD }}>The world's first Pet Life OS</span>
          </h2>
          <p style={{
            fontSize: "clamp(14px,2vw,16px)", color: C.muted,
            lineHeight: 1.8, fontFamily: "DM Sans, sans-serif",
            maxWidth: 600, margin: "0 auto 32px",
          }}>
            Mira is not a chatbot. She is not a recommendation engine.
            She is an operating system for your dog's entire life — from
            the moment you join until the day you say goodbye. She remembers
            everything, learns constantly, and acts across all 12 pillars.
          </p>

          {/* Mira capabilities */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12, marginTop: 40, textAlign: "left",
          }}>
            {[
              { icon: "🧠", title: "Never forgets", desc: "Every preference, allergy, and milestone is remembered forever." },
              { icon: "🎯", title: "Hyper-personalised", desc: "Filters every product and service for your specific dog's profile." },
              { icon: "🔮", title: "Proactively acts", desc: "Sends birthday alerts, refill reminders, and vet nudges before you ask." },
              { icon: "🤝", title: "Commands Concierge®", desc: "Real humans execute Mira's recommendations when you need them." },
            ].map((cap, i) => (
              <div key={i} style={{
                background: C.bgCard, border: `1px solid ${C.borderS}`,
                borderRadius: 16, padding: "20px 18px",
              }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{cap.icon}</div>
                <div style={{
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  fontSize: 17, fontWeight: 600, color: C.ivory,
                  marginBottom: 6,
                }}>
                  {cap.title}
                </div>
                <div style={{
                  fontSize: 12, color: C.mutedD,
                  fontFamily: "DM Sans, sans-serif", lineHeight: 1.55,
                }}>
                  {cap.desc}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── SECTION 4: MOJO'S SOUL CARD ─────────────────────────────────── */}
      <section
        id="mojo-soul-card"
        style={{
          padding: "80px clamp(20px,6vw,80px)",
          background: `radial-gradient(ellipse at 60% 30%, rgba(155,89,182,0.12) 0%, transparent 60%), ${C.bgDeep}`,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <SLabel>Live soul profile</SLabel>
              <h2 style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(2rem,5vw,3.2rem)",
                fontWeight: 400, color: C.ivory, marginBottom: 12,
              }}>
                This is what Mira knows<br />
                <span style={{ fontStyle: "italic", color: C.ivoryD }}>about Mojo.</span>
              </h2>
              <p style={{
                fontSize: 14, color: C.muted,
                fontFamily: "DM Sans, sans-serif",
              }}>
                After one session. Imagine what she knows after a year.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div
              data-testid="mojo-soul-card"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid rgba(201,151,58,0.22)`,
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 20px 80px rgba(0,0,0,0.4)",
              }}
            >
              {/* Card header */}
              <div style={{
                background: "linear-gradient(135deg, rgba(155,89,182,0.18) 0%, rgba(201,151,58,0.10) 100%)",
                padding: "28px 32px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
              }}>
                {/* Avatar */}
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "linear-gradient(135deg, #9B59B6, #C9973A)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, flexShrink: 0,
                  boxShadow: "0 0 24px rgba(155,89,182,0.4)",
                }}>
                  🐾
                </div>
                <div>
                  <div style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: 28, fontWeight: 600, color: C.ivory,
                    letterSpacing: "-0.01em",
                  }}>
                    {MOJO.name}
                  </div>
                  <div style={{
                    fontSize: 13, color: C.ivoryD,
                    fontFamily: "DM Sans, sans-serif", marginTop: 2,
                  }}>
                    {MOJO.breed} · {MOJO.lifeStage} · India
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {MOJO.words.map(w => (
                      <span key={w} style={{
                        fontSize: 11, fontWeight: 600, color: C.amber,
                        border: `1px solid ${C.border}`,
                        borderRadius: 999, padding: "3px 10px",
                        fontFamily: "DM Sans, sans-serif",
                        letterSpacing: "0.04em",
                      }}>
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{
                    fontSize: 10, color: C.amber, letterSpacing: "0.1em",
                    fontFamily: "DM Sans, sans-serif", fontWeight: 600, marginBottom: 4,
                  }}>
                    MIRA KNOWS
                  </div>
                  <div style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: 38, fontWeight: 300, color: C.amberL,
                    lineHeight: 1,
                  }}>
                    92<span style={{ fontSize: 18, color: C.amber }}>%</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.mutedD, fontFamily: "DM Sans, sans-serif" }}>
                    soul completeness
                  </div>
                </div>
              </div>

              {/* What Mira knows grid */}
              <div style={{ padding: "28px 32px" }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.14em",
                  color: C.amber, marginBottom: 16,
                  fontFamily: "DM Sans, sans-serif",
                }}>
                  WHAT MIRA KNOWS ABOUT MOJO
                </div>

                {/* Allergies row */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 10, color: C.mutedD, letterSpacing: "0.08em",
                    marginBottom: 8, fontFamily: "DM Sans, sans-serif", fontWeight: 600,
                  }}>
                    CANNOT HAVE — EVER
                  </div>
                  <div className="demo-soul-chips">
                    {MOJO.allergies.map(a => <AllergyChip key={a} label={a} />)}
                  </div>
                </div>

                {/* Loves row */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 10, color: C.mutedD, letterSpacing: "0.08em",
                    marginBottom: 8, fontFamily: "DM Sans, sans-serif", fontWeight: 600,
                  }}>
                    LOVES
                  </div>
                  <div className="demo-soul-chips">
                    {MOJO.loves.map(l => <LoveChip key={l} label={l} />)}
                  </div>
                </div>

                {/* Trait chips */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: 10, color: C.mutedD, letterSpacing: "0.08em",
                    marginBottom: 8, fontFamily: "DM Sans, sans-serif", fontWeight: 600,
                  }}>
                    SOUL TRAITS
                  </div>
                  <div className="demo-soul-chips">
                    <TraitChip icon="⚡" label={MOJO.energy} />
                    <TraitChip icon="😊" label={MOJO.temperament} />
                    <TraitChip icon="😴" label={`Sleeps on ${MOJO.sleep}`} />
                    <TraitChip icon="🌟" label={`Dream: ${MOJO.dream}`} />
                    <TraitChip icon="💫" label={`Wish: ${MOJO.wish}`} />
                  </div>
                </div>

                {/* Celebrations */}
                <div style={{ marginBottom: 0 }}>
                  <div style={{
                    fontSize: 10, color: C.mutedD, letterSpacing: "0.08em",
                    marginBottom: 8, fontFamily: "DM Sans, sans-serif", fontWeight: 600,
                  }}>
                    CELEBRATIONS MIRA TRACKS
                  </div>
                  <div className="demo-soul-chips">
                    {MOJO.celebrations.map(c => (
                      <span key={c} style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        background: "rgba(124,58,237,0.09)",
                        border: "1px solid rgba(124,58,237,0.22)",
                        borderRadius: 999, padding: "5px 12px",
                        fontSize: 12, fontWeight: 600, color: C.ivoryD,
                        fontFamily: "DM Sans, sans-serif",
                      }}>
                        🎉 {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mira speaks */}
              <div style={{
                background: "rgba(155,89,182,0.07)",
                borderTop: `1px solid rgba(155,89,182,0.15)`,
                padding: "20px 32px",
                display: "flex", gap: 14, alignItems: "flex-start",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: MIRA_ORB, flexShrink: 0,
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 13, color: "#fff",
                }}>
                  ✦
                </div>
                <div style={{
                  fontSize: 13.5, color: C.ivoryD,
                  fontStyle: "italic", lineHeight: 1.75,
                  fontFamily: "DM Sans, sans-serif",
                }}>
                  "Mojo cannot have chicken — I'll never suggest it. He's a senior Indie with high energy
                  and a sensitive stomach. His birthday is in Q4 and he loves peanut butter cake.
                  He sleeps in your bed, dreams of a happy joyful life, and his one wish is good health.
                  I know. I remember. Always."
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── SECTION 5: 12 PILLARS ───────────────────────────────────────── */}
      <section style={{
        padding: "100px clamp(20px,6vw,80px)",
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <SLabel>12 Life Pillars</SLabel>
              <h2 style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(2rem,5vw,3.4rem)",
                fontWeight: 400, color: C.ivory, marginBottom: 16,
              }}>
                Your dog's entire life.<br />
                <span style={{ fontStyle: "italic", color: C.ivoryD }}>Covered.</span>
              </h2>
              <p style={{
                fontSize: 15, color: C.muted,
                fontFamily: "DM Sans, sans-serif", maxWidth: 540, margin: "0 auto",
                lineHeight: 1.7,
              }}>
                From celebrations to emergencies — Mira knows which pillar
                matters most right now, and acts on it.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="demo-pillars" data-testid="demo-pillars-grid">
              {PILLARS.map((p, i) => (
                <PillarCard key={p.label} {...p} />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── SECTION 6: STATS ────────────────────────────────────────────── */}
      <section style={{
        padding: "80px clamp(20px,6vw,80px)",
        background: C.bgDeep,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <SLabel>By the numbers</SLabel>
              <h2 style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(1.8rem,4vw,2.8rem)",
                fontWeight: 400, color: C.ivory,
              }}>
                Building from love,<br />
                <span style={{ fontStyle: "italic", color: C.ivoryD }}>growing with purpose.</span>
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="demo-stats" data-testid="demo-stats-grid">
              {STATS.map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: "clamp(2.5rem,6vw,4rem)",
                    fontWeight: 300, color: C.amber, lineHeight: 1,
                  }}>
                    <Counter target={s.target} suffix={s.suffix} />
                  </div>
                  <div style={{
                    fontSize: 11, color: C.muted,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    marginTop: 10, fontFamily: "DM Sans, sans-serif",
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── SECTION 7: WAITLIST CTA ─────────────────────────────────────── */}
      <section style={{
        padding: "100px clamp(20px,6vw,80px)",
        textAlign: "center",
        background: `radial-gradient(ellipse at 50% 0%, rgba(155,89,182,0.15) 0%, transparent 60%), ${C.bg}`,
      }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <FadeIn>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: MIRA_ORB, margin: "0 auto 28px",
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 22, color: "#fff",
              boxShadow: "0 0 40px rgba(155,89,182,0.35)",
            }}>
              ✦
            </div>
            <SLabel>Early access</SLabel>
            <h2 style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "clamp(2rem,5vw,3.4rem)",
              fontWeight: 400, color: C.ivory,
              marginBottom: 16, lineHeight: 1.2,
            }}>
              Be among the first<br />
              <span style={{ fontStyle: "italic", color: C.ivoryD }}>to know Mira.</span>
            </h2>
            <p style={{
              fontSize: 15, color: C.muted,
              fontFamily: "DM Sans, sans-serif",
              lineHeight: 1.75, marginBottom: 40,
            }}>
              We're opening access to founding members soon.
              Leave your email and Mira will reach out — personally.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            {!submitted ? (
              <form
                onSubmit={handleWaitlist}
                data-testid="demo-waitlist-form"
                style={{
                  display: "flex", gap: 10, flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  data-testid="demo-waitlist-email"
                  required
                  style={{
                    flex: "1 1 260px", padding: "14px 20px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${C.borderS}`,
                    color: C.ivory, fontSize: 14,
                    fontFamily: "DM Sans, sans-serif",
                    outline: "none",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = C.amber + "60"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = C.borderS; }}
                />
                <button
                  type="submit"
                  data-testid="demo-waitlist-submit"
                  style={{
                    padding: "14px 32px", borderRadius: 999,
                    background: C.amber, border: "none",
                    color: C.bgDeep, fontSize: 14, fontWeight: 700,
                    cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                    transition: "all 0.2s",
                    boxShadow: `0 4px 20px ${C.amber}40`,
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
                >
                  Join the waitlist
                </button>
              </form>
            ) : (
              <div
                data-testid="demo-waitlist-success"
                style={{
                  padding: "24px 32px", borderRadius: 16,
                  background: C.purpleL,
                  border: `1px solid rgba(155,89,182,0.3)`,
                }}
              >
                <div style={{
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  fontSize: 22, fontWeight: 600, color: C.ivory,
                  marginBottom: 8,
                }}>
                  You're on the list. ✦
                </div>
                <div style={{
                  fontSize: 14, color: C.muted,
                  fontFamily: "DM Sans, sans-serif",
                }}>
                  Mira will reach out soon. We promise — she never forgets.
                </div>
              </div>
            )}
          </FadeIn>

          {/* Social proof */}
          <FadeIn delay={0.3}>
            <p style={{
              marginTop: 24, fontSize: 12, color: C.mutedD,
              fontFamily: "DM Sans, sans-serif",
            }}>
              Already trusted by 1,247+ dog families across India
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER / MYSTIQUE DEDICATION ────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${C.border}`,
        padding: "60px clamp(20px,6vw,80px) 48px",
        background: C.bgDeep,
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>

          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: 22, fontWeight: 600, color: C.ivory,
              letterSpacing: "0.02em", cursor: "pointer",
              marginBottom: 32, display: "inline-block",
            }}
          >
            The Doggy Company
            <span style={{ color: C.amber }}>®</span>
          </div>

          {/* Mystique dedication */}
          <div style={{
            background: "rgba(155,89,182,0.08)",
            border: `1px solid rgba(155,89,182,0.20)`,
            borderRadius: 18, padding: "28px 36px",
            marginBottom: 40,
          }}>
            <div style={{ fontSize: 22, marginBottom: 14 }}>🌷</div>
            <div style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "clamp(1rem,2.5vw,1.5rem)",
              fontWeight: 400, color: C.ivory,
              lineHeight: 1.7, fontStyle: "italic",
            }}>
              Built in memory of Mystique.<br />
              Launched on her birthday — May 15, 2026.<br />
              The world's first platform that knows your dog's soul.
            </div>
          </div>

          {/* Footer links */}
          <div style={{
            display: "flex", gap: 24, justifyContent: "center",
            flexWrap: "wrap", marginBottom: 28,
          }}>
            {[
              { label: "About", path: "/about" },
              { label: "Membership", path: "/membership" },
              { label: "Policies", path: "/policies" },
              { label: "Contact", path: "/contact" },
            ].map(link => (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                style={{
                  background: "none", border: "none",
                  color: C.mutedD, fontSize: 13,
                  cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.ivory; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.mutedD; }}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div style={{
            fontSize: 11, color: C.mutedD,
            fontFamily: "DM Sans, sans-serif",
            letterSpacing: "0.06em",
          }}>
            © 2026 The Doggy Company · India's soul-first Pet Life OS
          </div>
        </div>
      </footer>
    </div>
  );
}
