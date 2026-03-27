/**
 * PawrentJourney.jsx
 * The Doggy Company — The Pawrent Journey
 *
 * A living, always-on companion for every stage of pet parenthood.
 * Four modes: CONSIDERING → WELCOME_HOME → GROWING → ALWAYS
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ── API base ─────────────────────────────────────────────────────────────────
const API_URL =
  typeof window !== "undefined"
    ? window.__API_URL__ ||
      process.env.REACT_APP_BACKEND_URL ||
      "https://pet-soul-ranking.preview.emergentagent.com"
    : "";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  cream:     "#FDF6EE",
  amber:     "#C8873A",
  amberSoft: "#E8A85A",
  forest:    "#2C4A3E",
  forestL:   "#3D6B5A",
  sage:      "#40916C",
  sageSoft:  "#74C69D",
  sagePale:  "#D8F3DC",
  lavender:  "#8B7BAE",
  lavSoft:   "#B0A3CC",
  rose:      "#C4707A",
  roseSoft:  "#D99AA0",
  ink:       "#1A1208",
  inkSoft:   "#3D2E1A",
  muted:     "#8B7355",
  mutedSoft: "#B8A080",
  gold:      "#D4A840",
};

// ── Journey modes ─────────────────────────────────────────────────────────────
const MODES = {
  CONSIDERING: {
    id: "CONSIDERING",
    emoji: "🤔",
    label: "Considering",
    headline: "Thinking of bringing a dog home?",
    sub: "Mira will help you find the perfect match and prepare for the journey ahead.",
    color: T.lavender,
    colorSoft: T.lavSoft,
    bg: "#F5F0FF",
    miraMessage: () =>
      "I'll help you find a dog who matches your life — not just any dog. Tell me about yourself and I'll do the rest.",
  },
  WELCOME_HOME: {
    id: "WELCOME_HOME",
    emoji: "🏠",
    label: "Welcome Home",
    headline: "The adventure begins.",
    sub: "Your first days together are everything. Mira is with you every step.",
    color: T.amber,
    colorSoft: T.amberSoft,
    bg: "#FFF8F0",
    miraMessage: (name) =>
      `${name} is home. The first 72 hours are the most important. I've prepared everything you need — let's begin.`,
  },
  GROWING: {
    id: "GROWING",
    emoji: "🌱",
    label: "Growing Together",
    headline: "Every week, something new.",
    sub: "Milestones, habits, health — Mira tracks it all and guides you forward.",
    color: T.sage,
    colorSoft: T.sageSoft,
    bg: "#F0FFF4",
    miraMessage: (name) =>
      `Every week with ${name} teaches you something new. I'm tracking their milestones and making sure nothing gets missed.`,
  },
  ALWAYS: {
    id: "ALWAYS",
    emoji: "♾️",
    label: "Always There",
    headline: "A lifetime of knowing.",
    sub: "Life changes. Mira adapts. Your bond deepens.",
    color: T.rose,
    colorSoft: T.roseSoft,
    bg: "#FFF0F2",
    miraMessage: (name) =>
      `You know ${name} better than anyone. And I know them too. Together, we make sure every day is exactly right for them.`,
  },
};

// ── First steps per pillar — EVERGREEN (relevant every year, for every dog) ──
const FIRST_STEPS = {
  care: [
    { id:"care-vet-visit", icon:"🏥", title:"Vet visit",
      desc:"Regular vet check-ups keep your dog healthy year-round.",
      cta:"Book via Concierge®", pillar:"care", intent:"vet_visit" },
    { id:"care-vaccine-schedule", icon:"💉", title:"Vaccine schedule",
      desc:"Log and track every vaccination in Health Vault.",
      cta:"Open Health Vault →", pillar:"care", intent:"vaccine_schedule", route:true },
    { id:"care-grooming", icon:"✂️", title:"Grooming session",
      desc:"Regular grooming keeps coat and skin healthy all year.",
      cta:"Book via Concierge®", pillar:"care", intent:"grooming_booking" },
    { id:"care-wellness-check", icon:"🌿", title:"Annual wellness check",
      desc:"Mira reviews health, supplements, and care routine every year.",
      cta:"Review with Concierge®", pillar:"care", intent:"wellness_visit" },
  ],
  dine: [
    { id:"dine-meal-plan", icon:"🍽️", title:"Meal plan",
      desc:"Breed-appropriate nutrition — updated as your dog grows.",
      cta:"Build with Mira", pillar:"dine", intent:"meal_plan_setup" },
    { id:"dine-allergy-check", icon:"⚠️", title:"Allergy check",
      desc:"Keep food sensitivities updated — allergies can change.",
      cta:"Open Health Vault →", pillar:"dine", intent:"allergy_log", route:true },
    { id:"dine-fresh-food", icon:"🥗", title:"Fresh food trial",
      desc:"Mira recommends seasonal fresh meals for your dog's breed.",
      cta:"See recommendations →", pillar:"dine", intent:"fresh_meal_recommendation" },
  ],
  learn: [
    { id:"learn-training-session", icon:"🎓", title:"Training session",
      desc:"Regular training strengthens your bond all year.",
      cta:"Book training session", pillar:"learn", intent:"training_booking" },
    { id:"learn-behaviour-check", icon:"🧠", title:"Behaviour check",
      desc:"Annual behaviour review — catch issues early.",
      cta:"Book with Concierge®", pillar:"learn", intent:"behaviour_consult" },
    { id:"learn-enrichment", icon:"🎯", title:"Mental enrichment",
      desc:"Puzzle toys and new skills keep your dog sharp.",
      cta:"Get Mira's picks →", pillar:"learn", intent:"enrichment_recommendation" },
  ],
  paperwork: [
    { id:"paperwork-insurance", icon:"📋", title:"Insurance review",
      desc:"Annual insurance check — make sure you are always covered.",
      cta:"Review via Concierge®", pillar:"paperwork", intent:"insurance_enquiry" },
    { id:"paperwork-id-tag", icon:"🏷️", title:"Identity & tags",
      desc:"Check collar tags and microchip details are up to date.",
      cta:"Update via Concierge®", pillar:"paperwork", intent:"id_tag_order" },
    { id:"paperwork-health-records", icon:"📁", title:"Health records",
      desc:"Keep vaccines, vet visits and medications documented.",
      cta:"Open Health Vault →", pillar:"paperwork", intent:"health_records", route:true },
  ],
  go: [
    { id:"go-walk-explore", icon:"🦮", title:"Walk & explore",
      desc:"New routes, new smells — keep walks exciting year-round.",
      cta:"Find routes with Mira", pillar:"go", intent:"walk_guide" },
    { id:"go-boarding", icon:"🏠", title:"Boarding & daycare",
      desc:"Trusted care when you travel — Concierge arranges everything.",
      cta:"Book via Concierge®", pillar:"go", intent:"boarding_booking" },
    { id:"go-travel-plan", icon:"✈️", title:"Travel plan",
      desc:"Taking your dog on a trip? Mira handles all the logistics.",
      cta:"Plan with Concierge®", pillar:"go", intent:"travel_planning" },
  ],
  celebrate: [
    { id:"celebrate-birthday", icon:"🎂", title:"Plan birthday",
      desc:"Mira builds the perfect birthday box — every year.",
      cta:"Plan via Concierge®", pillar:"celebrate", intent:"birthday_planning" },
    { id:"celebrate-gotcha-day", icon:"🎉", title:"Gotcha Day",
      desc:"The day they came home. Celebrated every year.",
      cta:"Set reminder via Concierge®", pillar:"celebrate", intent:"gotcha_day_setup" },
    { id:"celebrate-breed-cake", icon:"🍰", title:"Order a breed cake",
      desc:"A cake made just for their breed — from The Doggy Bakery.",
      cta:"Order via Concierge®", pillar:"celebrate", intent:"cake_order" },
    { id:"celebrate-memory-photo", icon:"📸", title:"Memory photo",
      desc:"Capture this year. Mira reminds you every anniversary.",
      cta:"Book photography →", pillar:"celebrate", intent:"photography_booking" },
  ],
  play: [
    { id:"play-toys", icon:"🧸", title:"Toy refresh",
      desc:"Breed and age-appropriate toys — Mira updates picks every season.",
      cta:"See Mira's picks →", pillar:"play", intent:"toy_recommendation" },
    { id:"play-playdate", icon:"🐕", title:"Playdate",
      desc:"Social time with other dogs — essential for wellbeing.",
      cta:"Arrange via Concierge®", pillar:"play", intent:"playdate" },
    { id:"play-activity", icon:"🏃", title:"Activity plan",
      desc:"Mira builds a seasonal activity plan for your dog's energy level.",
      cta:"Build with Mira →", pillar:"play", intent:"activity_plan" },
  ],
  adopt: [
    { id:"adopt-home-check", icon:"🏡", title:"Home comfort check",
      desc:"Is the home set up right for your dog's current life stage?",
      cta:"Review with Mira →", pillar:"adopt", intent:"home_readiness" },
    { id:"adopt-soul-consult", icon:"💜", title:"Soul Adoption Consult",
      desc:"Thinking of adding another dog? Mira helps you find the right match.",
      cta:"Book Soul Consult →", pillar:"adopt", intent:"soul_adoption" },
  ],
};

// ── detectJourneyMode — GROWING extended to 365 days ─────────────────────────
export function detectJourneyMode(pet) {
  if (!pet) return "CONSIDERING";
  const createdAt = pet.created_at || pet.createdAt;
  if (!createdAt) return "GROWING";
  const daysSince = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSince <= 3) return "WELCOME_HOME";
  if (daysSince <= 365) return "GROWING";
  return "ALWAYS";
}

// ── bookViaConciergeDirect — internal helper ──────────────────────────────────
async function bookViaConciergeDirect({ pet, step, token }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      parent_id: user?.id || user?.email || "guest",
      pet_id: pet?.id || "unknown",
      pillar: step.pillar,
      intent_primary: step.intent,
      life_state: "WELCOME_HOME",
      channel: "pawrent_journey",
      initial_message: {
        sender: "parent",
        text: `Pawrent Journey — ${step.title} for ${pet?.name || "my dog"}`,
      },
    }),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// PawrentFirstStepsTab — shows on every pillar page, for ALL modes except CONSIDERING
// NEVER hides for ALWAYS mode — every pet parent sees their journey steps forever
// ══════════════════════════════════════════════════════════════════════════════
export function PawrentFirstStepsTab({ pet, token, currentPillar = "care", onNavigate, defaultCollapsed = false }) {
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState({});
  const [dismissed, setDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const navigate = useNavigate();

  const mode = detectJourneyMode(pet);
  const steps = FIRST_STEPS[currentPillar] || [];
  const petName = pet?.name || "your dog";
  const currentModeData = MODES[mode];

  // Fetch progress — hooks must always run before any early return
  useEffect(() => {
    if (!pet?.id || !token) return;
    fetch(`${API_URL}/api/pawrent-journey/progress/${pet.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCompletedSteps(d.completed_steps || []))
      .catch(() => {});
  }, [pet?.id, token]);

  // Only hide for CONSIDERING (no pet) or no steps defined for this pillar
  if (mode === "CONSIDERING" || steps.length === 0) return null;
  if (dismissed) return null;

  const completeStep = async (step) => {
    if (!pet?.id || !token) return;
    setLoading(true);
    try {
      if (step.route) {
        navigate(`/pet-vault/${pet.id}`);
        return;
      }
      await bookViaConciergeDirect({ pet, step, token });
      await fetch(`${API_URL}/api/pawrent-journey/complete-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pet_id: pet.id,
          step_id: step.id,
          pillar: step.pillar,
        }),
      });
      setCompletedSteps((prev) => [...prev, step.id]);
      setBooked((prev) => ({ ...prev, [step.id]: true }));
    } catch (e) {
      console.error("Step completion failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = steps.length;
  const completedCount = steps.filter((s) => completedSteps.includes(s.id)).length;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  return (
    <div
      style={{
        margin: "0 0 24px 0",
        background: currentModeData.bg,
        border: `1.5px solid ${currentModeData.color}33`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsCollapsed(c => !c)}
        style={{
          padding: "14px 18px",
          borderBottom: isCollapsed ? "none" : `1px solid ${currentModeData.color}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: `${currentModeData.color}11`,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{currentModeData.emoji}</span>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: currentModeData.color,
                textTransform: "uppercase",
              }}
            >
              PAWRENT JOURNEY · FIRST STEP
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, marginTop: 1 }}>
              {steps[completedCount]?.title || "All steps complete!"}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: T.muted }}>{completedCount}/{totalSteps} done</div>
            <div
              style={{
                marginTop: 4,
                width: 60,
                height: 4,
                background: `${currentModeData.color}22`,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progressPct}%`,
                  height: "100%",
                  background: currentModeData.color,
                  borderRadius: 4,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
          {completedCount === totalSteps && (
            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
              aria-label="Dismiss"
              data-testid="pawrent-journey-dismiss"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: T.muted,
                fontSize: 16,
                lineHeight: 1,
                opacity: 0.7,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}
            >
              ✕
            </button>
          )}
          {/* Collapse chevron */}
          <span style={{ fontSize: 14, color: T.muted, transition: "transform 0.2s", display: "inline-block", transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)" }}>▾</span>
        </div>
      </div>

      {/* Steps — hidden when collapsed */}
      {!isCollapsed && <div style={{ padding: "12px 18px 16px" }}>
        {steps.map((step, idx) => {
          const isDone = completedSteps.includes(step.id);
          const isJustBooked = booked[step.id];
          return (
            <div
              key={step.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "10px 0",
                borderBottom:
                  idx < steps.length - 1
                    ? `1px solid ${currentModeData.color}15`
                    : "none",
                opacity: isDone ? 0.6 : 1,
              }}
            >
              <span style={{ fontSize: 20, marginTop: 1 }}>{step.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
                  {isDone && "✅ "}
                  {step.title}
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                  {step.desc}
                </div>
              </div>
              {!isDone && (
                <button
                  onClick={() => completeStep(step)}
                  disabled={loading}
                  style={{
                    background: "none",
                    border: `1.5px solid ${currentModeData.color}`,
                    color: currentModeData.color,
                    borderRadius: 20,
                    padding: "5px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isJustBooked ? "Sent ✓" : step.cta}
                </button>
              )}
            </div>
          );
        })}

        {/* Mira note */}
        <div
          style={{
            marginTop: 12,
            padding: "10px 14px",
            background: `${currentModeData.color}11`,
            borderRadius: 10,
            borderLeft: `3px solid ${currentModeData.color}`,
          }}
        >
          <div style={{ fontSize: 11, color: currentModeData.color, fontWeight: 700 }}>
            ✦ Mira knows {petName}
          </div>
          <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 3 }}>
            {currentModeData.miraMessage(petName)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: T.muted,
              marginTop: 4,
              fontStyle: "italic",
            }}
          >
            Will be arranged by your Concierge®
          </div>
        </div>
      </div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PawrentJourneyCard — the dashboard card
// ══════════════════════════════════════════════════════════════════════════════
export function PawrentJourneyCard({ pet, token, onClick }) {
  const [completedSteps, setCompletedSteps] = useState([]);
  const mode = detectJourneyMode(pet);
  const modeData = MODES[mode];
  const petName = pet?.name || "your dog";

  const allSteps = Object.values(FIRST_STEPS).flat();
  const totalSteps = allSteps.length;

  useEffect(() => {
    if (!pet?.id || !token) return;
    fetch(`${API_URL}/api/pawrent-journey/progress/${pet.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCompletedSteps(d.completed_steps || []))
      .catch(() => {});
  }, [pet?.id, token]);

  const completedCount = allSteps.filter((s) =>
    completedSteps.includes(s.id)
  ).length;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  return (
    <div
      onClick={onClick}
      style={{
        background: modeData.bg,
        border: `1.5px solid ${modeData.color}33`,
        borderRadius: 16,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        marginBottom: 12,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 24px ${modeData.color}22`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>{modeData.emoji}</span>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: modeData.color,
                textTransform: "uppercase",
              }}
            >
              PAWRENT JOURNEY
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>
              {modeData.headline}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
              {completedCount} of {totalSteps} first steps complete
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: modeData.color }}>
            {progressPct}%
          </div>
          <div style={{ fontSize: 10, color: T.muted }}>complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginTop: 12,
          height: 4,
          background: `${modeData.color}22`,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: "100%",
            background: modeData.color,
            borderRadius: 4,
            transition: "width 0.8s ease",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 11,
          color: T.muted,
          fontStyle: "italic",
        }}
      >
        {modeData.miraMessage(petName)}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Default export — full PawrentJourney page
// ══════════════════════════════════════════════════════════════════════════════
export default function PawrentJourney({ pet, token }) {
  const [mode, setMode] = useState(detectJourneyMode(pet));
  const [completedSteps, setCompletedSteps] = useState([]);
  const [activeTab, setActiveTab] = useState("care");
  const navigate = useNavigate();

  const petName = pet?.name || "your dog";
  const currentModeData = MODES[mode];
  const tabs = Object.keys(FIRST_STEPS);

  useEffect(() => {
    if (!pet?.id || !token) return;
    fetch(`${API_URL}/api/pawrent-journey/progress/${pet.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setCompletedSteps(d.completed_steps || []))
      .catch(() => {});
  }, [pet?.id, token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: currentModeData.bg,
        fontFamily: "Georgia, serif",
        transition: "background 0.5s ease",
      }}
    >
      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(160deg, ${currentModeData.color}22 0%, transparent 60%)`,
          padding: "48px 24px 32px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>{currentModeData.emoji}</div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: currentModeData.color,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          PAWRENT JOURNEY · {currentModeData.label.toUpperCase()}
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: T.ink,
            margin: "0 0 8px 0",
          }}
        >
          {currentModeData.headline}
        </h1>
        <p style={{ fontSize: 15, color: T.muted, margin: "0 0 24px 0", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
          {currentModeData.sub}
        </p>

        {/* Mode selector */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {Object.values(MODES).map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: `1.5px solid ${m.color}`,
                background: mode === m.id ? m.color : "transparent",
                color: mode === m.id ? "#fff" : m.color,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mira quote */}
      <div
        style={{
          margin: "0 24px 24px",
          padding: "14px 18px",
          background: `${currentModeData.color}11`,
          borderRadius: 12,
          borderLeft: `3px solid ${currentModeData.color}`,
        }}
      >
        <div style={{ fontSize: 11, color: currentModeData.color, fontWeight: 700 }}>
          ✦ Mira knows {petName}
        </div>
        <div style={{ fontSize: 14, color: T.inkSoft, marginTop: 4, fontStyle: "italic" }}>
          "{currentModeData.miraMessage(petName)}"
        </div>
      </div>

      {/* Pillar tabs */}
      <div style={{ padding: "0 24px" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 8,
            marginBottom: 16,
          }}
        >
          {tabs.map((tab) => {
            const tabSteps = FIRST_STEPS[tab] || [];
            const done = tabSteps.filter((s) => completedSteps.includes(s.id)).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  border: `1.5px solid ${isActive ? currentModeData.color : T.mutedSoft}`,
                  background: isActive ? currentModeData.color : "transparent",
                  color: isActive ? "#fff" : T.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  textTransform: "capitalize",
                }}
              >
                {tab} {done > 0 && `${done}/${tabSteps.length}`}
              </button>
            );
          })}
        </div>

        <PawrentFirstStepsTab
          pet={pet}
          token={token}
          currentPillar={activeTab}
          onNavigate={navigate}
        />
      </div>
    </div>
  );
}
