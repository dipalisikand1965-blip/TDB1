/**
 * PawrentJourney.jsx
 * The Doggy Company — The Pawrent Journey
 * FULLY WIRED — real API calls, real pet data, real concierge flow
 *
 * ── WIRING GUIDE FOR EMERGENT ────────────────────────────────────────────────
 *
 * STEP 1 — Copy this file to:
 *   /app/frontend/src/components/pawrent/PawrentJourney.jsx
 *
 * STEP 2 — Create the page wrapper at:
 *   /app/frontend/src/pages/PawrentJourneyPage.jsx
 *   Content: just import and render <PawrentJourneyPage /> from this file
 *
 * STEP 3 — Add route in App.jsx:
 *   <Route path="/pawrent-journey" element={<PawrentJourneyPage />} />
 *
 * STEP 4 — Add dashboard card in PetHomePage.jsx (or Dashboard.jsx):
 *   import { PawrentJourneyCard } from '../components/pawrent/PawrentJourney';
 *   Place AFTER the Pet Life Pass card, BEFORE the Orders card:
 *   <PawrentJourneyCard pet={activePet} token={token} onClick={() => navigate('/pawrent-journey')} />
 *
 * STEP 5 — Add First Steps tab in these pillar pages:
 *   CareMobilePage.jsx, DineSoulPage.jsx, LearnPage.jsx, PaperworkPage.jsx,
 *   GoMobilePage.jsx, CelebrateMobilePage.jsx, PlayMobilePage.jsx, AdoptPage.jsx
 *   Import: import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
 *   Place BELOW the hero section, ABOVE the product tabs:
 *   <PawrentFirstStepsTab pet={activePet} token={token} currentPillar="care" />
 *
 * STEP 6 — Add to side menu (MobileMenu.jsx or SideNav.jsx):
 *   Add link: { label: "Pawrent Journey", icon: "🐾", route: "/pawrent-journey" }
 *   Show a pulsing green dot if mode === "WELCOME_HOME"
 *
 * STEP 7 — Create two new backend endpoints in server.py:
 *
 *   @api_router.post("/pawrent-journey/complete-step")
 *   async def complete_pawrent_step(body: dict, username = Depends(verify_token)):
 *       await db.pawrent_journey_progress.update_one(
 *           {"pet_id": body["pet_id"], "user": username},
 *           {"$addToSet": {"completed_steps": body["step_id"]},
 *            "$set": {"updated_at": datetime.now(timezone.utc)}},
 *           upsert=True
 *       )
 *       return {"ok": True}
 *
 *   @api_router.get("/pawrent-journey/progress/{pet_id}")
 *   async def get_pawrent_progress(pet_id: str, username = Depends(verify_token)):
 *       doc = await db.pawrent_journey_progress.find_one({"pet_id": pet_id, "user": username})
 *       return {"completed_steps": doc.get("completed_steps", []) if doc else []}
 *
 * APIs USED (already exist):
 *   GET  /api/pets/my-pets                          → fetch all pets
 *   POST /api/service_desk/attach_or_create_ticket  → canonical concierge flow
 *   POST /api/notifications/whatsapp-optin          → WhatsApp opt-in
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../../utils/api";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  cream:    "#FDF6EE",
  amber:    "#C8873A",
  amberSoft:"#E8A85A",
  forest:   "#2C4A3E",
  forestL:  "#3D6B5A",
  lavender: "#8B7BAE",
  lavSoft:  "#B0A3CC",
  rose:     "#C4707A",
  roseSoft: "#D99AA0",
  ink:      "#1A1208",
  inkSoft:  "#3D2E1A",
  muted:    "#8B7355",
  mutedSoft:"#B8A080",
};

// ── Journey modes ─────────────────────────────────────────────────────────────
const MODES = {
  CONSIDERING: {
    id: "CONSIDERING", emoji: "🤔", label: "Considering",
    headline: "Thinking of bringing a dog home?",
    sub: "Mira will help you find the perfect match and prepare for the journey ahead.",
    color: T.lavender, colorSoft: T.lavSoft, bg: "#F5F0FF",
    miraMessage: () =>
      "I'll help you find a dog who matches your life — not just any dog. Tell me about yourself and I'll do the rest.",
  },
  WELCOME_HOME: {
    id: "WELCOME_HOME", emoji: "🏠", label: "Welcome Home",
    headline: "The adventure begins.",
    sub: "Your first days together are everything. Mira is with you every step.",
    color: T.amber, colorSoft: T.amberSoft, bg: "#FFF8F0",
    miraMessage: (name) =>
      `${name} is home. The first 72 hours are the most important. I've prepared everything you need — let's begin.`,
  },
  GROWING: {
    id: "GROWING", emoji: "🌱", label: "Growing Together",
    headline: "Every week, something new.",
    sub: "Milestones, habits, health — Mira tracks it all and guides you forward.",
    color: T.forest, colorSoft: T.forestL, bg: "#F0F8F4",
    miraMessage: (name) =>
      `Every week with ${name} teaches you something new. I'm tracking their milestones and making sure nothing gets missed.`,
  },
  ALWAYS: {
    id: "ALWAYS", emoji: "♾️", label: "Always There",
    headline: "A lifetime of knowing.",
    sub: "Life changes. Mira adapts. Your bond deepens.",
    color: T.rose, colorSoft: T.roseSoft, bg: "#FFF0F2",
    miraMessage: (name) =>
      `You know ${name} better than anyone. And I know them too. Together, we make sure every day is exactly right for them.`,
  },
};

/**
 * detectJourneyMode
 * Exported — use this in dashboard, pillar pages, and side menu
 * to know which mode a pet is in without rendering the full component.
 *
 * Usage:
 *   import { detectJourneyMode } from '../components/pawrent/PawrentJourney';
 *   const mode = detectJourneyMode(activePet); // "WELCOME_HOME" | "GROWING" | etc.
 */
export function detectJourneyMode(pet) {
  if (!pet) return "CONSIDERING";
  const joinedAt = pet.created_at || pet.added_at || pet.joined_at;
  if (!joinedAt) return "WELCOME_HOME";
  const days = Math.floor((Date.now() - new Date(joinedAt).getTime()) / 86400000);
  if (days < 7)  return "WELCOME_HOME";
  if (days < 90) return "GROWING";
  return "ALWAYS";
}

// ── All steps with IDs for completion tracking ────────────────────────────────
const STEPS = {
  CONSIDERING: [
    { id: "con-breed",      pillar: "Learn",     icon: "🎓", title: "Are you ready?",      desc: "Lifestyle match, breed guide, cost of ownership",               action: "Explore breeds",   route: "/learn",     concierge: false },
    { id: "con-adopt",      pillar: "Adopt",     icon: "🐾", title: "Find your match",      desc: "Rescue, breeder, or shelter — Mira helps you choose",            action: "Find a dog",       route: "/adopt",     concierge: false },
    { id: "con-paperwork",  pillar: "Paperwork", icon: "📋", title: "What you'll need",     desc: "Documents, registrations, what to prepare before they arrive",   action: "See checklist",    route: "/paperwork", concierge: true  },
    { id: "con-vet",        pillar: "Care",      icon: "🏥", title: "Find a vet first",     desc: "Register with a vet before your dog comes home",                 action: "Find a vet",       route: "/care",      concierge: true  },
    { id: "con-food",       pillar: "Dine",      icon: "🍖", title: "What will they eat?",  desc: "Nutrition basics for puppies and adult dogs",                    action: "Explore food",     route: "/dine",      concierge: false },
    { id: "con-go",         pillar: "Go",        icon: "✈️", title: "Where can they go?",   desc: "Pet-friendly homes, travel rules, transport options",             action: "Plan ahead",       route: "/go",        concierge: false },
  ],
  WELCOME_HOME: [
    { id: "wel-vet",        pillar: "Care",      icon: "🏥", title: "First vet visit",      desc: "Book within the first 72 hours — vaccinations and health check", action: "Book now",         route: "/care",      concierge: true,  urgent: true },
    { id: "wel-meal",       pillar: "Dine",      icon: "🍖", title: "First meal plan",       desc: "What to feed today, this week, and next month",                  action: "See Mira's picks", route: "/dine",      concierge: false, urgent: true },
    { id: "wel-night",      pillar: "Learn",     icon: "🎓", title: "First night survival",  desc: "Where to sleep, what to do when they cry, how to settle them",   action: "Read guide",       route: "/learn",     concierge: false },
    { id: "wel-register",   pillar: "Paperwork", icon: "📋", title: "Register them",         desc: "Microchip, licence, insurance — do it in week one",              action: "Start paperwork",  route: "/paperwork", concierge: true  },
    { id: "wel-essentials", pillar: "Shop",      icon: "🛍️", title: "What to buy today",    desc: "The only essentials you actually need right now",                action: "Shop essentials",  route: "/shop",      concierge: false },
    { id: "wel-celebrate",  pillar: "Celebrate", icon: "🎉", title: "Welcome home day",      desc: "Make their first day special — Mira has ideas",                  action: "Plan the day",     route: "/celebrate", concierge: false },
  ],
  GROWING: [
    { id: "grw-training",   pillar: "Learn",     icon: "🎓", title: "Week 1–4 training",    desc: "Name, sit, no, come — the four commands that matter first",      action: "Start training",   route: "/learn",     concierge: false },
    { id: "grw-vaccine",    pillar: "Care",      icon: "🏥", title: "Vaccine schedule",      desc: "Log and track every vaccination in Health Vault",                action: "Open vault",       route: "/care",      concierge: true  },
    { id: "grw-nutrition",  pillar: "Dine",      icon: "🍖", title: "Monthly nutrition",     desc: "What changes as they grow — puppy to adolescent",               action: "Update food plan", route: "/dine",      concierge: false },
    { id: "grw-social",     pillar: "Play",      icon: "🎾", title: "Socialisation",         desc: "Other dogs, people, sounds — the critical window",              action: "Play guide",       route: "/play",      concierge: false },
    { id: "grw-outing",     pillar: "Go",        icon: "✈️", title: "First outing",         desc: "Safe walks, first car ride, first pet-friendly café",            action: "Plan outing",      route: "/go",        concierge: false },
    { id: "grw-review",     pillar: "Paperwork", icon: "📋", title: "1 month review",        desc: "Update records, check insurance, review vet notes",             action: "Review",           route: "/paperwork", concierge: true  },
  ],
  ALWAYS: [
    { id: "alw-health",     pillar: "Care",      icon: "🏥", title: "Annual health check",   desc: "What changes year by year — Mira tracks it all",                action: "View schedule",    route: "/care",      concierge: true  },
    { id: "alw-seasonal",   pillar: "Dine",      icon: "🍖", title: "Seasonal nutrition",    desc: "What your dog needs changes with the seasons",                  action: "Update plan",      route: "/dine",      concierge: false },
    { id: "alw-enrich",     pillar: "Learn",     icon: "🎓", title: "New tricks, always",    desc: "Mental enrichment never stops — keep them sharp",               action: "Explore learning", route: "/learn",     concierge: false },
    { id: "alw-bucket",     pillar: "Go",        icon: "✈️", title: "Bucket list",          desc: "Dog-friendly places they should experience in their lifetime",   action: "See list",         route: "/go",        concierge: false },
    { id: "alw-birthday",   pillar: "Celebrate", icon: "🎉", title: "Every birthday",        desc: "Mark every year — they go too fast",                            action: "Plan birthday",    route: "/celebrate", concierge: false },
    { id: "alw-farewell",   pillar: "Farewell",  icon: "🌷", title: "When the time comes",   desc: "Plan with love, not in grief. Mira is here.",                   action: "Open gently",      route: "/farewell",  concierge: true  },
  ],
};

// ── API calls ─────────────────────────────────────────────────────────────────
const authHeader = (token) => token ? { Authorization: `Bearer ${token}` } : {};

async function fetchProgress(petId, token) {
  try {
    const r = await fetch(`${API_URL}/api/pawrent-journey/progress/${petId}`, { headers: authHeader(token) });
    if (!r.ok) return [];
    const d = await r.json();
    return d.completed_steps || [];
  } catch { return []; }
}

async function markStepDone(petId, stepId, pillar, mode, token) {
  try {
    await fetch(`${API_URL}/api/pawrent-journey/complete-step`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify({ pet_id: petId, step_id: stepId, pillar, mode }),
    });
  } catch {}
}

async function createTicket({ petId, petName, title, desc, pillar, token }) {
  try {
    const r = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify({
        pet_id: petId,
        title: `Pawrent Journey — ${title}`,
        description: `${desc}\n\nFor: ${petName}\nPillar: ${pillar}\nSource: Pawrent Journey`,
        pillar: pillar.toLowerCase(),
        type: "pawrent_journey",
        priority: "normal",
      }),
    });
    return await r.json();
  } catch { return null; }
}

async function whatsappOptin(petId, petName, token) {
  try {
    await fetch(`${API_URL}/api/notifications/whatsapp-optin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify({ pet_id: petId, pet_name: petName, automation_type: "pawrent_journey_daily" }),
    });
  } catch {}
}

// ── Typing effect ─────────────────────────────────────────────────────────────
function useTyping(text, speed = 16) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setOut(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      setOut(text.slice(0, ++i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return { out, done };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function PawrentJourney({ pet = null, token = null, initialMode = null, className = "" }) {
  const navigate = useNavigate();

  const autoMode = pet ? detectJourneyMode(pet) : "CONSIDERING";
  const [mode, setMode] = useState(initialMode || autoMode);
  const [expanded, setExpanded] = useState(null);
  const [done, setDone] = useState([]);
  const [loading, setLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [whatsappOn, setWhatsappOn] = useState(false);

  const cm = MODES[mode];
  const petName = pet?.name || "your dog";
  const petId = pet?.id || pet?._id;
  const steps = STEPS[mode] || [];

  const miraFull = cm.miraMessage(petName);
  const { out: miraText, done: miraDone } = useTyping(miraFull, 16);

  const joinedDays = (() => {
    const d = pet?.created_at || pet?.added_at;
    return d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : 0;
  })();

  const doneCount = steps.filter(s => done.includes(s.id)).length;

  useEffect(() => {
    if (!petId) return;
    fetchProgress(petId, token).then(setDone);
  }, [petId, token]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleStep = useCallback(async (step) => {
    setLoading(step.id);
    await markStepDone(petId, step.id, step.pillar, mode, token);
    setDone(prev => [...new Set([...prev, step.id])]);

    if (step.concierge && petId) {
      const ticket = await createTicket({ petId, petName, title: step.title, desc: step.desc, pillar: step.pillar, token });
      if (ticket?.ticket_id) showToast(`Sent to your Concierge® · Ticket #${ticket.ticket_id}`);
    }

    setLoading(null);
    navigate(step.route);
  }, [petId, petName, mode, token, navigate]);

  const handleWhatsapp = async () => {
    await whatsappOptin(petId, petName, token);
    setWhatsappOn(true);
    showToast("Mira will message you every morning 💬");
  };

  return (
    <div className={`pawrent-journey ${className}`} style={{
      fontFamily: "'Georgia', serif",
      background: cm.bg, borderRadius: "24px",
      overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
      maxWidth: "900px", margin: "0 auto", transition: "background 0.5s ease",
    }}>

      {/* Mode tabs */}
      <div style={{ display: "flex", background: "rgba(0,0,0,0.04)", borderBottom: `2px solid ${cm.color}22`, overflowX: "auto" }}>
        {Object.values(MODES).map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setExpanded(null); }} style={{
            flex: "1 0 80px", padding: "14px 8px", border: "none",
            background: mode === m.id ? cm.color : "transparent",
            color: mode === m.id ? "#fff" : T.muted,
            fontFamily: "inherit", fontSize: "11px",
            fontWeight: mode === m.id ? "700" : "400",
            cursor: "pointer", transition: "all 0.3s ease",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
          }}>
            <span style={{ fontSize: "18px" }}>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          background: T.forest, color: "#fff", padding: "12px 20px",
          fontSize: "13px", fontFamily: "'Helvetica Neue', sans-serif",
          textAlign: "center",
        }}>✓ {toast}</div>
      )}

      {/* Hero */}
      <div style={{
        padding: "32px 32px 24px",
        background: `linear-gradient(135deg, ${cm.bg} 0%, ${cm.color}15 100%)`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: "-40px", right: "-40px",
          width: "180px", height: "180px", borderRadius: "50%",
          background: `${cm.color}10`, pointerEvents: "none",
        }} />

        {pet?.image_url && (
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%",
            overflow: "hidden", border: `3px solid ${cm.color}`,
            marginBottom: "16px", boxShadow: `0 4px 16px ${cm.color}40`,
          }}>
            <img src={pet.image_url} alt={petName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        <div style={{
          display: "inline-block", background: `${cm.color}18`,
          border: `1px solid ${cm.color}40`, borderRadius: "20px",
          padding: "4px 14px", fontSize: "10px",
          fontFamily: "'Helvetica Neue', sans-serif",
          letterSpacing: "0.12em", color: cm.color,
          fontWeight: "600", marginBottom: "12px", textTransform: "uppercase",
        }}>
          The Pawrent Journey · {cm.label}
        </div>

        <h1 style={{
          margin: "0 0 8px", fontSize: "clamp(20px, 4vw, 30px)",
          fontWeight: "700", color: T.ink, lineHeight: "1.2", letterSpacing: "-0.02em",
        }}>
          {cm.headline.replace("your dog", petName)}
        </h1>

        <p style={{
          margin: "0 0 20px", fontSize: "14px", color: T.muted,
          fontFamily: "'Helvetica Neue', sans-serif", lineHeight: "1.6", maxWidth: "500px",
        }}>
          {cm.sub}
        </p>

        {(mode === "GROWING" || mode === "ALWAYS") && pet && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: `${cm.color}15`, border: `1px solid ${cm.color}30`,
            borderRadius: "12px", padding: "6px 14px", marginBottom: "16px",
          }}>
            <span style={{ fontSize: "13px" }}>📅</span>
            <span style={{
              fontSize: "12px", fontFamily: "'Helvetica Neue', sans-serif",
              fontWeight: "600", color: cm.color,
            }}>
              Day {joinedDays} with {petName}
            </span>
          </div>
        )}

        {/* Mira message */}
        <div style={{ background: T.ink, borderRadius: "16px", padding: "16px 20px", maxWidth: "540px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
              background: `linear-gradient(135deg, ${cm.color}, ${cm.colorSoft})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px",
            }}>✦</div>
            <div>
              <div style={{
                fontSize: "10px", fontFamily: "'Helvetica Neue', sans-serif",
                letterSpacing: "0.12em", color: cm.colorSoft,
                fontWeight: "600", marginBottom: "6px", textTransform: "uppercase",
              }}>
                Mira · for {petName}
              </div>
              <p style={{
                margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.88)",
                fontStyle: "italic", lineHeight: "1.6", minHeight: "40px",
              }}>
                "{miraText}{!miraDone && <span style={{ opacity: 0.4 }}>|</span>}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {(mode === "GROWING" || mode === "ALWAYS") && (
        <div style={{
          padding: "16px 32px",
          background: "rgba(0,0,0,0.02)",
          borderBottom: `1px solid ${cm.color}20`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontFamily: "'Helvetica Neue', sans-serif", fontWeight: "600", color: T.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {petName}'s progress
            </span>
            <span style={{ fontSize: "12px", fontFamily: "'Helvetica Neue', sans-serif", fontWeight: "700", color: cm.color }}>
              {doneCount}/{steps.length} steps complete
            </span>
          </div>
          <div style={{ position: "relative", height: "5px", background: `${cm.color}20`, borderRadius: "3px" }}>
            <div style={{
              position: "absolute", left: 0, top: 0, height: "100%",
              width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%`,
              background: `linear-gradient(90deg, ${cm.color}, ${cm.colorSoft})`,
              borderRadius: "3px", transition: "width 0.8s ease",
            }} />
          </div>
        </div>
      )}

      {/* Steps grid */}
      <div style={{ padding: "24px 32px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{
            margin: 0, fontSize: "15px", fontWeight: "700",
            color: T.inkSoft, fontFamily: "'Helvetica Neue', sans-serif",
          }}>
            {mode === "CONSIDERING" ? "Before they arrive" :
             mode === "WELCOME_HOME" ? "This week's priorities" :
             mode === "GROWING" ? "This month's milestones" : "Always on your list"}
          </h2>
          {pet?.breed && (
            <span style={{ fontSize: "11px", fontFamily: "'Helvetica Neue', sans-serif", color: T.mutedSoft, fontStyle: "italic" }}>
              For {petName} · {pet.breed}
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
          {steps.map((step, idx) => {
            const isDone = done.includes(step.id);
            const isOpen = expanded === idx;
            const isLoading = loading === step.id;

            return (
              <div key={step.id}
                onClick={() => !isDone && setExpanded(isOpen ? null : idx)}
                style={{
                  background: isDone ? `${cm.color}08` : "#fff",
                  borderRadius: "16px", padding: "18px",
                  cursor: isDone ? "default" : "pointer",
                  border: `1.5px solid ${isDone ? `${cm.color}40` : isOpen ? cm.color : "transparent"}`,
                  boxShadow: isOpen ? `0 4px 24px ${cm.color}25` : "0 2px 12px rgba(0,0,0,0.06)",
                  transition: "all 0.25s ease",
                  position: "relative", opacity: isDone ? 0.7 : 1,
                }}
              >
                {step.urgent && !isDone && (
                  <div style={{
                    position: "absolute", top: "10px", right: "10px",
                    background: T.rose, color: "#fff", fontSize: "9px",
                    fontFamily: "'Helvetica Neue', sans-serif", fontWeight: "700",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "2px 7px", borderRadius: "8px",
                  }}>Today</div>
                )}

                {isDone && (
                  <div style={{
                    position: "absolute", top: "10px", right: "10px",
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: cm.color, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: "700",
                  }}>✓</div>
                )}

                <span style={{ fontSize: "24px", display: "block", marginBottom: "10px" }}>{step.icon}</span>

                <div style={{
                  fontSize: "10px", fontFamily: "'Helvetica Neue', sans-serif",
                  fontWeight: "600", letterSpacing: "0.08em",
                  color: cm.color, textTransform: "uppercase", marginBottom: "4px",
                }}>{step.pillar}</div>

                <h3 style={{ margin: "0 0 5px", fontSize: "14px", fontWeight: "700", color: T.ink, lineHeight: "1.3" }}>
                  {step.title}
                </h3>

                <p style={{
                  margin: "0 0 10px", fontSize: "12px", color: T.muted,
                  fontFamily: "'Helvetica Neue', sans-serif", lineHeight: "1.5",
                }}>
                  {step.desc}
                </p>

                {step.concierge && !isDone && (
                  <div style={{
                    fontSize: "10px", fontFamily: "'Helvetica Neue', sans-serif",
                    color: T.mutedSoft, marginBottom: "8px",
                  }}>
                    🎩 Arranged by Concierge®
                  </div>
                )}

                {isOpen && !isDone && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStep(step); }}
                    disabled={isLoading}
                    style={{
                      width: "100%", padding: "10px",
                      background: isLoading ? T.mutedSoft : cm.color,
                      color: "#fff", border: "none", borderRadius: "10px",
                      fontFamily: "'Helvetica Neue', sans-serif",
                      fontSize: "13px", fontWeight: "700",
                      cursor: isLoading ? "wait" : "pointer",
                    }}
                  >
                    {isLoading ? "Opening..." : `${step.action} →`}
                  </button>
                )}

                {isDone && (
                  <div style={{ fontSize: "11px", fontFamily: "'Helvetica Neue', sans-serif", color: cm.color, fontWeight: "600" }}>
                    ✓ Done
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* WhatsApp opt-in */}
      <div style={{
        margin: "0 32px 28px", padding: "16px 20px",
        background: whatsappOn
          ? "linear-gradient(135deg, #1A7A3A, #25A853)"
          : "linear-gradient(135deg, #25D366, #128C7E)",
        borderRadius: "16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: "16px", flexWrap: "wrap", transition: "background 0.4s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "22px" }}>💬</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#fff", fontFamily: "'Helvetica Neue', sans-serif", marginBottom: "2px" }}>
              {whatsappOn ? `Mira will message you every morning about ${petName}` : `Get daily tips for ${petName} on WhatsApp`}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", fontFamily: "'Helvetica Neue', sans-serif" }}>
              {whatsappOn ? "First message arrives tomorrow morning ✓" : "One tip every morning. No spam. Just love."}
            </div>
          </div>
        </div>
        {!whatsappOn && (
          <button onClick={handleWhatsapp} style={{
            background: "#fff", color: "#128C7E", border: "none",
            borderRadius: "12px", padding: "10px 20px",
            fontFamily: "'Helvetica Neue', sans-serif",
            fontSize: "13px", fontWeight: "700",
            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            Turn on ✓
          </button>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "14px 32px", borderTop: `1px solid ${cm.color}20`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "12px",
      }}>
        <p style={{ margin: 0, fontSize: "11px", fontFamily: "'Helvetica Neue', sans-serif", color: T.mutedSoft, fontStyle: "italic" }}>
          ♥ Built in memory of Mystique · The Doggy Company
        </p>
        <button onClick={() => navigate("/pawrent-journey")} style={{
          background: "transparent", border: `1px solid ${cm.color}50`,
          borderRadius: "20px", padding: "6px 16px",
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: "12px", color: cm.color, cursor: "pointer", fontWeight: "600",
        }}>
          See full journey →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD CARD — compact version
// Import: import { PawrentJourneyCard } from '../components/pawrent/PawrentJourney';
// Place AFTER Pet Life Pass card, BEFORE Orders card in PetHomePage/Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export function PawrentJourneyCard({ pet, token, onClick }) {
  const mode = pet ? detectJourneyMode(pet) : "CONSIDERING";
  const cm = MODES[mode];
  const petName = pet?.name || "your dog";

  return (
    <div onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; }}
      style={{
        background: `linear-gradient(135deg, ${cm.bg}, ${cm.color}20)`,
        borderRadius: "20px", padding: "20px", cursor: "pointer",
        border: `1.5px solid ${cm.color}30`,
        boxShadow: `0 4px 20px ${cm.color}18`,
        transition: "transform 0.2s ease",
        fontFamily: "'Georgia', serif", userSelect: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        {pet?.image_url
          ? <img src={pet.image_url} alt={petName} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${cm.color}` }} />
          : <span style={{ fontSize: "28px" }}>{cm.emoji}</span>
        }
        <div>
          <div style={{ fontSize: "10px", fontFamily: "'Helvetica Neue', sans-serif", fontWeight: "700", letterSpacing: "0.1em", color: cm.color, textTransform: "uppercase" }}>
            Pawrent Journey
          </div>
          <div style={{ fontSize: "14px", fontWeight: "700", color: T.ink }}>
            {cm.label}
          </div>
        </div>
        {mode === "WELCOME_HOME" && (
          <div style={{
            marginLeft: "auto", width: "10px", height: "10px",
            borderRadius: "50%", background: T.rose,
            boxShadow: `0 0 8px ${T.rose}`,
          }} />
        )}
      </div>

      <p style={{ margin: "0 0 14px", fontSize: "12px", color: T.muted, fontFamily: "'Helvetica Neue', sans-serif", lineHeight: "1.5", fontStyle: "italic" }}>
        "{cm.miraMessage(petName).slice(0, 85)}..."
      </p>

      <div style={{ fontSize: "12px", fontFamily: "'Helvetica Neue', sans-serif", fontWeight: "700", color: cm.color }}>
        Continue {petName}'s journey →
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIRST STEPS TAB — use inside pillar pages
// Import: import { PawrentFirstStepsTab } from '../components/pawrent/PawrentJourney';
// Only renders for WELCOME_HOME and GROWING modes — invisible otherwise
// Place BELOW hero section, ABOVE product tabs
// ─────────────────────────────────────────────────────────────────────────────
export function PawrentFirstStepsTab({ pet, token, currentPillar }) {
  const navigate = useNavigate();

  const mode = pet ? detectJourneyMode(pet) : null;
  if (!mode || mode === "CONSIDERING" || mode === "ALWAYS") return null;

  const cm = MODES[mode];
  const petName = pet?.name || "your dog";
  const step = STEPS[mode]?.find(s => s.pillar.toLowerCase() === (currentPillar || "").toLowerCase());
  if (!step) return null;

  const handleAction = async () => {
    const petId = pet?.id || pet?._id;
    await markStepDone(petId, step.id, step.pillar, mode, token);
    if (step.concierge && petId) {
      await createTicket({ petId, petName, title: step.title, desc: step.desc, pillar: step.pillar, token });
    }
    navigate(step.route);
  };

  return (
    <div style={{
      background: `${cm.color}10`, borderRadius: "16px", padding: "18px",
      border: `1.5px solid ${cm.color}30`,
      fontFamily: "'Helvetica Neue', sans-serif", margin: "16px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{ fontSize: "18px" }}>{cm.emoji}</span>
        <div>
          <div style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.1em", color: cm.color, textTransform: "uppercase" }}>
            Pawrent Journey · First Step
          </div>
          <div style={{ fontSize: "14px", fontWeight: "700", color: T.ink }}>{step.title}</div>
        </div>
      </div>

      <p style={{ margin: "0 0 12px", fontSize: "12px", color: T.muted, lineHeight: "1.5" }}>
        {step.desc}
      </p>

      {step.urgent && (
        <div style={{
          background: `${T.rose}15`, border: `1px solid ${T.rose}40`,
          borderRadius: "8px", padding: "7px 12px",
          fontSize: "11px", color: T.rose, fontWeight: "600", marginBottom: "12px",
        }}>
          ⚡ Recommended in the first 72 hours
        </div>
      )}

      {step.concierge && (
        <div style={{ fontSize: "11px", color: T.mutedSoft, marginBottom: "10px" }}>
          🎩 Will be arranged by your Concierge®
        </div>
      )}

      <button onClick={handleAction} style={{
        background: cm.color, color: "#fff", border: "none",
        borderRadius: "10px", padding: "11px 20px",
        fontSize: "13px", fontWeight: "700",
        cursor: "pointer", width: "100%",
      }}>
        {step.action} →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE WRAPPER
// Create /app/frontend/src/pages/PawrentJourneyPage.jsx with this content:
//
// import { PawrentJourneyPage } from '../components/pawrent/PawrentJourney';
// export default PawrentJourneyPage;
//
// Then in App.jsx add:
// <Route path="/pawrent-journey" element={<PawrentJourneyPageWrapper />} />
// ─────────────────────────────────────────────────────────────────────────────
export function PawrentJourneyPage() {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined"
    ? localStorage.getItem("tdb_auth_token")
    : null;

  useEffect(() => {
    // Uses existing TDC API — same endpoint all pillar pages use
    fetch(`${API_URL}/api/pets/my-pets`, {
      headers: authHeader(token),
    })
      .then(r => r.json())
      .then(data => {
        const pets = data.pets || data || [];
        setPet(pets.find(p => p.is_active) || pets[0] || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const mode = pet ? detectJourneyMode(pet) : "CONSIDERING";
  const cm = MODES[mode];

  if (loading) return (
    <div style={{
      minHeight: "60vh", display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "'Helvetica Neue', sans-serif",
      color: T.muted, fontSize: "14px",
    }}>
      Mira is preparing your journey...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: cm.bg, padding: "24px 16px 60px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto 24px", fontFamily: "'Helvetica Neue', sans-serif" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.12em", color: T.muted, textTransform: "uppercase", marginBottom: "4px" }}>
          The Doggy Company
        </div>
        <h1 style={{ margin: 0, fontSize: "clamp(24px, 5vw, 36px)", fontFamily: "'Georgia', serif", fontWeight: "700", color: T.ink, letterSpacing: "-0.02em" }}>
          The Pawrent Journey
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: "14px", color: T.muted, lineHeight: "1.6" }}>
          A living companion for every stage of life with {pet?.name || "your dog"}.
        </p>
      </div>

      <PawrentJourney pet={pet} token={token} />
    </div>
  );
}
