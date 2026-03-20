/**
 * LandingPage.jsx — /
 * The Doggy Company
 *
 * The first thing anyone sees.
 * One feeling: "I want to be part of this."
 *
 * Design: Deep midnight luxury editorial.
 * Cormorant Garamond for headlines — ancient, warm, alive.
 * DM Sans for body — clean, modern, trustworthy.
 * Amber gold accents — warmth without flash.
 * Dark backgrounds — intimate, not cold.
 *
 * Sections:
 *   1. Hero — "Your dog has a soul. We know it."
 *   2. The feeling — what makes TDC different
 *   3. Pet Soul demo — Mojo's profile card (the real sell)
 *   4. How it works — Understand → Guide → Support → Remember
 *   5. The 13 pillars — their whole life covered
 *   6. Mira introduction
 *   7. The Doggy Bakery + Streaties
 *   8. Mystique dedication
 *   9. Final CTA — "I want to be part of this"
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const C = {
  night:   "#0A0A0F",
  deep:    "#0F0A1E",
  mid:     "#1A1040",
  amber:   "#C9973A",
  amberL:  "#E8B84B",
  ivory:   "#F5F0E8",
  ivoryD:  "#D4C9B0",
  sage:    "#40916C",
  muted:   "rgba(245,240,232,0.55)",
  border:  "rgba(201,151,58,0.2)",
};

const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ── Animated counter ───────────────────────────────────────────────────
function Counter({ target, label, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          start = Math.min(start + step, target);
          setCount(Math.floor(start));
          if (start >= target) clearInterval(timer);
        }, 16);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: "Cormorant Garamond, Georgia, serif",
        fontSize: "clamp(2.5rem,6vw,4rem)",
        fontWeight: 300, color: C.amber,
        lineHeight: 1,
      }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{
        fontSize: 12, color: C.muted,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        marginTop: 8,
        fontFamily: "DM Sans, sans-serif",
      }}>
        {label}
      </div>
    </div>
  );
}

// ── Pillar chip ────────────────────────────────────────────────────────
function PillarChip({ icon, label, colour }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px",
        borderRadius: 999,
        border: `1px solid ${hovered ? colour : "rgba(255,255,255,0.1)"}`,
        background: hovered ? `${colour}18` : "rgba(255,255,255,0.04)",
        transition: "all 0.2s",
        cursor: "default",
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{
        fontSize: 13, color: hovered ? C.ivory : C.muted,
        fontFamily: "DM Sans, sans-serif", fontWeight: 500,
        transition: "color 0.2s",
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Section fade in ────────────────────────────────────────────────────
function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const handleJoin = () => navigate(isAuthenticated ? "/pet-home" : "/join");

  const PILLARS = [
    { icon:"🌿", label:"Care",       colour:"#40916C" },
    { icon:"🍽️", label:"Dine",       colour:"#C9973A" },
    { icon:"✈️", label:"Go",         colour:"#1D9E75" },
    { icon:"🎾", label:"Play",       colour:"#E76F51" },
    { icon:"🎓", label:"Learn",      colour:"#7C3AED" },
    { icon:"🎂", label:"Celebrate",  colour:"#9B59B6" },
    { icon:"🛍️", label:"Shop",       colour:"#C9973A" },
    { icon:"📄", label:"Paperwork",  colour:"#0F6E56" },
    { icon:"🚨", label:"Emergency",  colour:"#DC2626" },
    { icon:"🐾", label:"Adopt",      colour:"#7B3FA0" },
    { icon:"🌷", label:"Farewell",   colour:"#334155" },
    { icon:"🤝", label:"Services",   colour:"#1D9E75" },
    { icon:"💡", label:"Advisory",   colour:"#0F6E56" },
  ];

  return (
    <div style={{
      background: C.night,
      fontFamily: "DM Sans, sans-serif",
      color: C.ivory,
      overflowX: "hidden",
    }}>
      <style>{`
        ${FONTS}
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${C.amber}40; }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes pulse {
          0%,100% { opacity: 0.4; }
          50%      { opacity: 0.8; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "16px clamp(20px,5vw,60px)",
        background: scrolled ? "rgba(10,10,15,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "none",
        transition: "all 0.3s",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{
          fontFamily: "Cormorant Garamond, Georgia, serif",
          fontSize: 22, fontWeight: 600, color: C.ivory,
          letterSpacing: "0.02em",
        }}>
          The Doggy Company
          <span style={{ color: C.amber, marginLeft: 4 }}>®</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => navigate("/about")} style={{
            background: "none", border: "none",
            color: C.muted, fontSize: 14, cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
          }}>
            Our Story
          </button>
          <button onClick={() => navigate("/membership")} style={{
            background: "none", border: "none",
            color: C.muted, fontSize: 14, cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
          }}>
            Membership
          </button>
          <button onClick={handleJoin} style={{
            padding: "9px 22px", borderRadius: 999,
            border: `1px solid ${C.amber}`,
            background: "transparent",
            color: C.amber, fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "DM Sans, sans-serif",
            transition: "all 0.2s",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.amber;
              e.currentTarget.style.color = C.night;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.amber;
            }}
          >
            {isAuthenticated ? "My Dogs →" : "Join Now"}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse at 30% 50%, #1A1040 0%, ${C.night} 60%)`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "120px clamp(20px,6vw,80px) 80px",
        position: "relative", overflow: "hidden",
        textAlign: "center",
      }}>
        {/* Background orbs */}
        <div style={{
          position: "absolute", top: "15%", left: "8%",
          width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(155,89,182,0.12) 0%,transparent 70%)",
          animation: "float 8s ease-in-out infinite",
          pointerEvents: "none",
        }}/>
        <div style={{
          position: "absolute", bottom: "20%", right: "10%",
          width: 260, height: 260, borderRadius: "50%",
          background: "radial-gradient(circle,rgba(201,151,58,0.1) 0%,transparent 70%)",
          animation: "float 10s ease-in-out infinite 2s",
          pointerEvents: "none",
        }}/>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(201,151,58,0.12)",
          border: `1px solid ${C.border}`,
          borderRadius: 999, padding: "6px 18px",
          fontSize: 11, fontWeight: 600,
          color: C.amber, letterSpacing: "0.1em",
          marginBottom: 32,
          fontFamily: "DM Sans, sans-serif",
          animation: "pulse 3s ease-in-out infinite",
        }}>
          ✦ THE DOGGY COMPANY · MIRA
        </div>

        {/* Main headline */}
        <h1 style={{
          fontFamily: "Cormorant Garamond, Georgia, serif",
          fontSize: "clamp(3rem,8vw,6.5rem)",
          fontWeight: 300, lineHeight: 1.1,
          color: C.ivory,
          maxWidth: 900,
          marginBottom: 16,
          letterSpacing: "-0.01em",
        }}>
          Your dog has a soul.
          <br/>
          <em style={{
            color: C.amber,
            fontStyle: "italic",
          }}>
            We remember it.
          </em>
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: "clamp(16px,2.5vw,20px)",
          color: C.muted, lineHeight: 1.8,
          maxWidth: 560, marginBottom: 48,
          fontWeight: 300,
        }}>
          Not a subscription. Not a pet shop. A living relationship
          between you, your dog, and a system that truly knows them.
          Built in memory of Mystique.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={handleJoin} style={{
            padding: "16px 40px", borderRadius: 999,
            border: "none",
            background: `linear-gradient(135deg,${C.amber},${C.amberL})`,
            color: C.night, fontSize: 16, fontWeight: 600,
            cursor: "pointer", fontFamily: "DM Sans, sans-serif",
            letterSpacing: "0.02em",
          }}>
            I want to be part of this →
          </button>
          <button onClick={() => navigate("/about")} style={{
            padding: "16px 36px", borderRadius: 999,
            border: `1px solid rgba(245,240,232,0.2)`,
            background: "transparent",
            color: C.ivoryD, fontSize: 16, cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
          }}>
            Our Story
          </button>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: "absolute", bottom: 32,
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 6,
          opacity: 0.4,
        }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: C.ivoryD }}>SCROLL</div>
          <div style={{ width: 1, height: 40, background: C.ivoryD, animation: "pulse 2s infinite" }}/>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{
        background: C.deep,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        padding: "48px clamp(20px,6vw,80px)",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 40,
        }}>
          <Counter target={45000} label="Pet Families" suffix="+"/>
          <Counter target={13} label="Life Pillars"/>
          <Counter target={5358} label="Curated Products"/>
          <Counter target={1000} label="Concierge Team" suffix="+"/>
        </div>
      </section>

      {/* ── WHAT MAKES US DIFFERENT ── */}
      <section style={{
        padding: "100px clamp(20px,6vw,80px)",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: C.amber,
              letterSpacing: "0.14em", marginBottom: 16,
              fontFamily: "DM Sans, sans-serif",
            }}>
              WHAT MAKES US DIFFERENT
            </div>
            <h2 style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "clamp(2rem,5vw,3.5rem)",
              fontWeight: 400, color: C.ivory,
              lineHeight: 1.2,
            }}>
              Every other pet company is built<br/>
              around <em style={{ color: C.amber }}>human convenience.</em>
              <br/>We built around your dog's inner life.
            </h2>
          </div>
        </FadeIn>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 2,
        }}>
          {[
            {
              label: "NOT THIS",
              items: ["A shopping app", "A discount club", "A subscription box", "A booking platform"],
              dark: true,
            },
            {
              label: "THIS",
              items: [
                "A personal concierge for your dog",
                "Memory that grows smarter over time",
                "A system that understands your pet first",
                "Anything · Anytime · Anywhere",
              ],
              dark: false,
            },
          ].map((col, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div style={{
                background: col.dark ? "rgba(255,255,255,0.03)" : `${C.amber}12`,
                border: `1px solid ${col.dark ? "rgba(255,255,255,0.06)" : C.border}`,
                borderRadius: 20, padding: "32px 28px",
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                  color: col.dark ? "rgba(255,255,255,0.3)" : C.amber,
                  marginBottom: 20,
                  fontFamily: "DM Sans, sans-serif",
                }}>
                  {col.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {col.items.map((item, j) => (
                    <div key={j} style={{
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <span style={{
                        fontSize: 14,
                        color: col.dark ? "rgba(255,255,255,0.2)" : C.amber,
                        flexShrink: 0,
                      }}>
                        {col.dark ? "✕" : "✦"}
                      </span>
                      <span style={{
                        fontSize: 15, lineHeight: 1.5,
                        color: col.dark ? "rgba(255,255,255,0.35)" : C.ivory,
                        fontFamily: "DM Sans, sans-serif",
                        textDecoration: col.dark ? "line-through" : "none",
                      }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── PET SOUL DEMO — THE REAL SELL ── */}
      <section style={{
        background: C.deep,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        padding: "100px clamp(20px,6vw,80px)",
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: C.amber,
                letterSpacing: "0.14em", marginBottom: 16,
                fontFamily: "DM Sans, sans-serif",
              }}>
                PET SOUL™ · WHAT MIRA KNOWS
              </div>
              <h2 style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(2rem,5vw,3.2rem)",
                fontWeight: 400, color: C.ivory,
              }}>
                This is what it means<br/>
                <em style={{ color: C.amber }}>to be truly known.</em>
              </h2>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${C.border}`,
              borderRadius: 24, overflow: "hidden",
              maxWidth: 700, margin: "0 auto",
            }}>
              {/* Profile header */}
              <div style={{
                background: "linear-gradient(135deg,#0F0A1E,#1A1040)",
                padding: "28px 28px 24px",
                display: "flex", alignItems: "center", gap: 20,
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: MIRA_ORB,
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 28,
                }}>
                  🐾
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: 24, fontWeight: 600, color: C.ivory, marginBottom: 4,
                  }}>
                    Mojo
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>
                    Indie · Senior · Mumbai
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["Playful", "Food-lover", "Brave"].map(t => (
                      <span key={t} style={{
                        background: "rgba(201,151,58,0.15)",
                        border: `1px solid ${C.border}`,
                        borderRadius: 999, padding: "2px 10px",
                        fontSize: 11, fontWeight: 600, color: C.amber,
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: 36, fontWeight: 300, color: C.amber,
                    lineHeight: 1,
                  }}>
                    80%
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>soul score</div>
                </div>
              </div>

              {/* What Mira knows */}
              <div style={{ padding: "24px 28px", borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: C.amber,
                  letterSpacing: "0.1em", marginBottom: 16,
                  fontFamily: "DM Sans, sans-serif",
                }}>
                  WHAT MIRA KNOWS ABOUT MOJO
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
                  gap: 10,
                }}>
                  {[
                    { label: "ALLERGY", value: "No chicken — ever", alert: true },
                    { label: "DIET",    value: "Grain-free meals" },
                    { label: "ENERGY",  value: "Very high" },
                    { label: "LOVES",   value: "Peanut butter cake" },
                    { label: "HEALTH",  value: "On treatment" },
                    { label: "MOOD",    value: "Brave every day" },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: item.alert
                        ? "rgba(220,38,38,0.1)"
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${item.alert ? "rgba(220,38,38,0.25)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 10, padding: "10px 12px",
                    }}>
                      <div style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                        color: item.alert ? "#F87171" : C.amber,
                        marginBottom: 4,
                        fontFamily: "DM Sans, sans-serif",
                      }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 12, color: C.ivory, fontWeight: 500 }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mira speaks */}
              <div style={{
                padding: "20px 28px",
                display: "flex", gap: 12, alignItems: "flex-start",
                background: "rgba(155,89,182,0.06)",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: MIRA_ORB,
                  display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 12,
                  color: "#fff", flexShrink: 0,
                }}>✦</div>
                <div style={{
                  fontSize: 13, color: C.muted,
                  fontStyle: "italic", lineHeight: 1.7,
                }}>
                  "Mojo cannot have chicken — I'll never suggest it.
                  He's on lymphoma treatment so I keep everything gentle.
                  His birthday is coming and he loves peanut butter cake. 🌷"
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.3}>
            <p style={{
              textAlign: "center", marginTop: 24,
              fontSize: 14, color: C.muted, fontStyle: "italic",
            }}>
              This is Mojo's profile after one session.
              Imagine what Mira knows after a year.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{
        padding: "100px clamp(20px,6vw,80px)",
        maxWidth: 1000, margin: "0 auto",
      }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: C.amber,
              letterSpacing: "0.14em", marginBottom: 16,
              fontFamily: "DM Sans, sans-serif",
            }}>
              HOW IT WORKS
            </div>
            <h2 style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "clamp(2rem,5vw,3rem)",
              fontWeight: 400, color: C.ivory,
            }}>
              Mira never forgets.
            </h2>
          </div>
        </FadeIn>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 24,
        }}>
          {[
            { n:"01", icon:"🔍", title:"Understand", desc:"We learn everything about your dog — breed, personality, health, fears, loves. Your soul profile grows with every interaction." },
            { n:"02", icon:"🧭", title:"Guide",      desc:"Personalised recommendations across all 13 pillars of their life. Mira filters out what isn't right for your specific dog." },
            { n:"03", icon:"🤝", title:"Support",    desc:"Concierge® arranges everything — from birthday cakes to emergency vets. Real humans. Real action." },
            { n:"04", icon:"🧠", title:"Remember",   desc:"Every visit enriches the soul profile. Mira gets smarter and more specific over time. She never starts from zero." },
          ].map((item, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid rgba(255,255,255,0.06)`,
                borderRadius: 20, padding: "32px 24px",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute", top: 20, right: 20,
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  fontSize: 48, fontWeight: 300,
                  color: "rgba(201,151,58,0.15)",
                  lineHeight: 1,
                }}>
                  {item.n}
                </div>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{item.icon}</div>
                <div style={{
                  fontFamily: "Cormorant Garamond, Georgia, serif",
                  fontSize: 22, fontWeight: 600, color: C.ivory,
                  marginBottom: 12,
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontSize: 13, color: C.muted, lineHeight: 1.7,
                  fontFamily: "DM Sans, sans-serif",
                }}>
                  {item.desc}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── 13 PILLARS ── */}
      <section style={{
        background: C.deep,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        padding: "80px clamp(20px,6vw,80px)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: C.amber,
                letterSpacing: "0.14em", marginBottom: 16,
                fontFamily: "DM Sans, sans-serif",
              }}>
                13 LIFE PILLARS
              </div>
              <h2 style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(1.8rem,4vw,2.8rem)",
                fontWeight: 400, color: C.ivory,
              }}>
                Your dog's entire life. Covered.
              </h2>
              <p style={{
                fontSize: 15, color: C.muted, marginTop: 12,
                fontFamily: "DM Sans, sans-serif",
              }}>
                From celebrations to emergencies — Mira knows which pillar matters most right now.
              </p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {PILLARS.map(p => (
                <PillarChip key={p.label} {...p}/>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── MIRA INTRODUCTION ── */}
      <section style={{
        padding: "100px clamp(20px,6vw,80px)",
        maxWidth: 800, margin: "0 auto", textAlign: "center",
      }}>
        <FadeIn>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: MIRA_ORB,
            display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 30,
            color: "#fff", margin: "0 auto 28px",
            boxShadow: "0 0 60px rgba(155,89,182,0.3)",
          }}>
            ✦
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: C.amber,
            letterSpacing: "0.14em", marginBottom: 20,
            fontFamily: "DM Sans, sans-serif",
          }}>
            MEET MIRA
          </div>
          <h2 style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "clamp(2rem,5vw,3.2rem)",
            fontWeight: 400, color: C.ivory,
            marginBottom: 20, lineHeight: 1.3,
          }}>
            Mira is the Brain.
            <br/>
            <em style={{ color: C.amber }}>Concierge® is the Hands.</em>
          </h2>
          <p style={{
            fontSize: 16, color: C.muted, lineHeight: 1.8,
            fontFamily: "DM Sans, sans-serif", fontWeight: 300,
          }}>
            Mira is not a chatbot. She's a Pet Life Operating System —
            built on your dog's soul profile, powered by AI, and connected
            to a team of over 1,000 trained concierge professionals who
            arrange everything you need.
          </p>
          <p style={{
            fontSize: 16, color: C.muted, lineHeight: 1.8,
            fontFamily: "DM Sans, sans-serif", fontWeight: 300,
            marginTop: 16,
          }}>
            Ask Mira anything about your dog.
            She already knows the answer.
          </p>
        </FadeIn>
      </section>

      {/* ── STREATIES ── */}
      <section style={{
        background: `linear-gradient(135deg,${C.deep},#0A1A12)`,
        borderTop: `1px solid rgba(64,145,108,0.2)`,
        borderBottom: `1px solid rgba(64,145,108,0.2)`,
        padding: "60px clamp(20px,6vw,80px)",
      }}>
        <FadeIn>
          <div style={{
            maxWidth: 700, margin: "0 auto", textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>🐾</div>
            <h3 style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "clamp(1.5rem,4vw,2.2rem)",
              fontWeight: 400, color: C.ivory, marginBottom: 12,
            }}>
              10% of every The Doggy Bakery purchase
              feeds a street animal.
            </h3>
            <p style={{
              fontSize: 14, color: C.muted, lineHeight: 1.7,
              fontFamily: "DM Sans, sans-serif",
            }}>
              Through Streaties, every order you place is also an act of kindness
              for a dog who has no home. Your dog's joy feeds another dog's survival.
            </p>
            <div style={{
              marginTop: 20, display: "inline-flex",
              alignItems: "center", gap: 8,
              background: "rgba(64,145,108,0.12)",
              border: "1px solid rgba(64,145,108,0.25)",
              borderRadius: 999, padding: "8px 20px",
              fontSize: 12, fontWeight: 600, color: "#74C69D",
              fontFamily: "DM Sans, sans-serif",
            }}>
              🌿 Streaties · thedoggybakery.com/pages/streaties
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── MYSTIQUE DEDICATION ── */}
      <section style={{
        padding: "100px clamp(20px,6vw,80px)",
        maxWidth: 700, margin: "0 auto", textAlign: "center",
      }}>
        <FadeIn>
          <div style={{ fontSize: 32, marginBottom: 24 }}>🌷</div>
          <blockquote style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "clamp(1.3rem,3.5vw,2rem)",
            fontWeight: 300, fontStyle: "italic",
            color: C.ivoryD, lineHeight: 1.7,
            marginBottom: 24,
          }}>
            "She left us too soon.
            But she left us knowing what it means to truly know a dog —
            to know their soul."
          </blockquote>
          <div style={{
            fontSize: 11, letterSpacing: "0.14em",
            color: "rgba(245,240,232,0.35)",
            fontFamily: "DM Sans, sans-serif",
          }}>
            IN LOVING MEMORY OF MYSTIQUE & KOUROS
          </div>
          <div style={{
            marginTop: 8, fontSize: 11, color: "rgba(245,240,232,0.25)",
            fontFamily: "DM Sans, sans-serif",
          }}>
            The Doggy Company was built for them.
            And for every dog who deserves to be known.
          </div>
        </FadeIn>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{
        background: `radial-gradient(ellipse at 50% 100%,#1A1040 0%,${C.night} 60%)`,
        borderTop: `1px solid ${C.border}`,
        padding: "100px clamp(20px,6vw,80px) 120px",
        textAlign: "center",
      }}>
        <FadeIn>
          <div style={{
            fontSize: 11, fontWeight: 600, color: C.amber,
            letterSpacing: "0.14em", marginBottom: 20,
            fontFamily: "DM Sans, sans-serif",
          }}>
            READY?
          </div>
          <h2 style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "clamp(2.5rem,7vw,5rem)",
            fontWeight: 300, color: C.ivory,
            lineHeight: 1.15, marginBottom: 20,
          }}>
            Let Mira meet<br/>
            <em style={{ color: C.amber }}>your dog.</em>
          </h2>
          <p style={{
            fontSize: 16, color: C.muted, lineHeight: 1.7,
            fontFamily: "DM Sans, sans-serif",
            maxWidth: 480, margin: "0 auto 48px",
          }}>
            One membership. Everything included.
            Anything, Anytime, Anywhere for your dog.
          </p>
          <button onClick={handleJoin} style={{
            padding: "18px 56px",
            borderRadius: 999, border: "none",
            background: `linear-gradient(135deg,${C.amber},${C.amberL})`,
            color: C.night, fontSize: 18, fontWeight: 600,
            cursor: "pointer", fontFamily: "DM Sans, sans-serif",
            letterSpacing: "0.02em",
            boxShadow: `0 8px 40px ${C.amber}40`,
          }}>
            I want to be part of this →
          </button>
          <div style={{
            marginTop: 20, fontSize: 13, color: C.muted,
            fontFamily: "DM Sans, sans-serif",
          }}>
            Join the founding circle · ₹2,999/year after soft launch
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: C.night,
        borderTop: `1px solid ${C.border}`,
        padding: "40px clamp(20px,5vw,60px)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div style={{
          fontFamily: "Cormorant Garamond, Georgia, serif",
          fontSize: 18, fontWeight: 600, color: C.ivoryD,
        }}>
          The Doggy Company<span style={{ color: C.amber }}>®</span>
        </div>
        <div style={{
          display: "flex", gap: 24, flexWrap: "wrap",
        }}>
          {["About", "Membership", "FAQs", "Streaties", "Contact"].map(l => (
            <button key={l} onClick={() => navigate(`/${l.toLowerCase()}`)}
              style={{
                background: "none", border: "none",
                color: C.muted, fontSize: 13, cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "rgba(245,240,232,0.2)", fontFamily: "DM Sans, sans-serif" }}>
          © 2026 The Doggy Company · Mira is the Brain · Concierge® is the Hands
        </div>
      </footer>

    </div>
  );
}
