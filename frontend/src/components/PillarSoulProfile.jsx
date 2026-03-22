/**
 * PillarSoulProfile.jsx
 * Reusable soul profile bar + questions drawer for ANY pillar page.
 * Shows: pet avatar + breed/city/allergies tags + score → click → breed tips + questions modal.
 *
 * Usage: <PillarSoulProfile pet={pet} token={token} pillar="go" label="Trip" color="#0D9488" />
 */
import { useState, useCallback, useEffect } from "react";
import { Check, ChevronRight, Sparkles, X } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ── Helpers ──
function getAllergies(pet) {
  const soul = pet?.doggy_soul_answers || {};
  const raw = soul.food_allergies || pet?.allergies || pet?.soul_data?.allergies || [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr.filter(a => a && !["none","no","none known","no known allergies"].includes(String(a).toLowerCase()));
}

function getBreedTags(pet) {
  const tags = [];
  if (pet?.breed) tags.push({ icon: "\uD83D\uDC36", text: pet.breed });
  if (pet?.city)  tags.push({ icon: "\uD83D\uDCCD", text: pet.city });
  const allg = getAllergies(pet);
  allg.forEach(a => tags.push({ icon: "\u26A0\uFE0F", text: a }));
  const soul = pet?.doggy_soul_answers || {};
  if (soul.energy_level) tags.push({ icon: "\u26A1", text: soul.energy_level + " energy" });
  return tags.slice(0, 5);
}

// ── Pillar-specific label config ──
const PILLAR_CONFIG = {
  go:        { label: "Trip",        icon: "\u2708\uFE0F"  },
  dine:      { label: "Tummy",       icon: "\uD83C\uDF56" },
  care:      { label: "Wellness",    icon: "\uD83E\uDE7A" },
  play:      { label: "Play",        icon: "\uD83C\uDFBE" },
  celebrate: { label: "Celebration", icon: "\uD83C\uDF82" },
  learn:     { label: "Training",    icon: "\uD83C\uDF93" },
  paperwork: { label: "Paperwork",   icon: "\uD83D\uDCC4" },
  emergency: { label: "Safety",      icon: "\uD83D\uDEA8" },
  farewell:  { label: "Memory",      icon: "\uD83C\uDF37" },
  adopt:     { label: "Adoption",    icon: "\uD83C\uDFE0" },
  shop:      { label: "Shopping",    icon: "\uD83D\uDECD\uFE0F" },
  services:  { label: "Service",     icon: "\uD83E\uDD1D" },
};

export default function PillarSoulProfile({ pet, token, pillar = "go", color = "#0D9488" }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [liveScore, setLiveScore]   = useState(null);
  const [questions, setQuestions]    = useState([]);
  const [qLoading, setQLoading]     = useState(false);
  const [answers, setAnswers]       = useState({});
  const [submitting, setSubmitting]  = useState({});
  const [submitted, setSubmitted]    = useState({});
  const [totalPts, setTotalPts]      = useState(0);

  const petName = pet?.name || "your dog";
  const tags = getBreedTags(pet);
  const config = PILLAR_CONFIG[pillar] || { label: pillar, icon: "\u2B50" };
  const displayScore = liveScore ?? pet?.overall_score ?? 0;
  const scoreInt = Math.round(displayScore);

  const loadQuestions = useCallback(() => {
    if (!pet?.id) return;
    setQLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/quick-questions?limit=4&context=${pillar}`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        clearTimeout(timer);
        if (data) {
          setQuestions((data.questions || []).map(q => ({ ...q, pet_id: pet.id })));
          if (data.current_score !== undefined) setLiveScore(data.current_score);
        }
      })
      .catch(err => { if (err.name !== "AbortError") console.error(`[${config.label}Profile]`, err); })
      .finally(() => { clearTimeout(timer); setQLoading(false); });
  }, [pet?.id, pillar, config.label]);

  useEffect(() => { if (drawerOpen) loadQuestions(); }, [drawerOpen, loadQuestions]);

  const handleAnswer = (qId, val, type) => {
    setAnswers(prev => {
      if (type === "multi_select") {
        const cur = prev[qId] || [];
        return { ...prev, [qId]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
      }
      return { ...prev, [qId]: val };
    });
  };

  const handleSubmit = async q => {
    const answer = answers[q.question_id];
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return;
    setSubmitting(p => ({ ...p, [q.question_id]: true }));
    try {
      const res = await fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ question_id: q.question_id, answer }),
      });
      if (res.ok) {
        const data = await res.json();
        setTotalPts(p => p + (q.weight || 3));
        setSubmitted(p => ({ ...p, [q.question_id]: true }));
        if (data.scores?.overall !== undefined) {
          setLiveScore(data.scores.overall);
          window.dispatchEvent(new CustomEvent("soulScoreUpdated", { detail: { petId: pet.id, score: data.scores.overall } }));
        }
      }
    } catch (err) {
      console.error(`[${config.label}Profile submit]`, err);
    } finally {
      setSubmitting(p => ({ ...p, [q.question_id]: false }));
    }
  };

  const activeQs = questions.filter(q => !submitted[q.question_id]);

  return (
    <>
      {/* ── Compact profile bar ── */}
      <div
        onClick={() => setDrawerOpen(true)}
        data-testid={`${pillar}-profile-bar`}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: 14, cursor: "pointer",
          background: "#fff", border: "1px solid #e8e0d8",
          transition: "box-shadow 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          marginBottom: 16,
        }}
      >
        {pet?.photo_url && (
          <img src={pet.photo_url} alt={petName}
            style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: `2px solid ${color}30` }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A0A00" }}>
            {petName}'s {config.label} Profile
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
            {tags.map((t, i) => (
              <span key={i} style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 999,
                background: "#f5f0ea", color: "#666",
                display: "flex", alignItems: "center", gap: 3,
              }}>
                {t.icon} {t.text}
              </span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color, whiteSpace: "nowrap" }}>
          Mira's picks <ChevronRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
        </div>
      </div>

      {/* ── Modal overlay ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 50001, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            data-testid={`${pillar}-profile-drawer`}
            style={{
              width: "min(580px,100%)", maxHeight: "85vh", overflowY: "auto",
              borderRadius: 20, background: "#fff",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "20px 24px 16px", borderBottom: "1px solid #eee",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              position: "sticky", top: 0, background: "#fff", zIndex: 2, borderRadius: "20px 20px 0 0",
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#999", textTransform: "uppercase" }}>
                  {config.icon} Grow {petName}'s {config.label} Profile
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#111", marginTop: 4 }}>
                  {scoreInt}%
                  {totalPts > 0 && (
                    <span style={{ fontSize: 12, color, fontWeight: 600, marginLeft: 8 }}>
                      <Sparkles size={12} style={{ display: "inline", verticalAlign: "middle" }} /> +{totalPts} pts
                    </span>
                  )}
                </div>
                {/* Score bar */}
                <div style={{ width: 120, height: 4, borderRadius: 999, background: "#eee", marginTop: 6 }}>
                  <div style={{ height: "100%", borderRadius: 999, background: color, width: `${Math.min(scoreInt, 100)}%`, transition: "width 0.6s ease" }} />
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} data-testid={`${pillar}-profile-close`}
                style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #eee", background: "#fafafa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="#999" />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "16px 24px 24px" }}>

              {/* Pet breed tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {tags.map((t, i) => (
                  <span key={i} style={{
                    fontSize: 11, padding: "4px 10px", borderRadius: 999,
                    background: "#f5f0ea", color: "#555",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    {t.icon} {t.text}
                  </span>
                ))}
              </div>

              {/* Questions section */}
              {qLoading && (
                <div style={{ textAlign: "center", padding: 20, color: "#999", fontSize: 13 }}>
                  Loading {petName}'s questions...
                </div>
              )}

              {!qLoading && activeQs.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#999", textTransform: "uppercase", marginBottom: 10 }}>
                    Help Mira know {petName} better
                  </div>
                  {activeQs.map(q => {
                    const qId = q.question_id;
                    const hasAns = answers[qId] && (Array.isArray(answers[qId]) ? answers[qId].length > 0 : true);
                    return (
                      <div key={qId} data-testid={`${pillar}-q-${qId}`}
                        style={{ background: "#fafafa", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 10, lineHeight: 1.4 }}>
                          {q.question_text?.replace(/{name}/g, petName) || q.question_text}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {(q.options || []).map(opt => {
                            const sel = q.type === "multi_select"
                              ? (answers[qId] || []).includes(opt)
                              : answers[qId] === opt;
                            return (
                              <button key={opt} onClick={() => handleAnswer(qId, opt, q.type)}
                                data-testid={`${pillar}-opt-${qId}-${opt.replace(/\s+/g, '-').toLowerCase()}`}
                                style={{
                                  padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                                  border: sel ? `1.5px solid ${color}` : "1px solid #ddd",
                                  background: sel ? `${color}10` : "#fff",
                                  color: sel ? color : "#666",
                                  fontWeight: sel ? 600 : 400,
                                  transition: "all 0.15s",
                                }}>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {hasAns && (
                          <button onClick={() => handleSubmit(q)} disabled={submitting[qId]}
                            data-testid={`${pillar}-submit-${qId}`}
                            style={{
                              marginTop: 10, display: "flex", alignItems: "center", gap: 6,
                              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                              background: color, color: "#fff", border: "none", cursor: "pointer",
                              opacity: submitting[qId] ? 0.5 : 1,
                            }}>
                            {submitting[qId] ? "Saving..." : <><Check size={12} /> Save</>}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!qLoading && activeQs.length === 0 && (
                <div style={{ textAlign: "center", padding: "16px 0", color: "#999" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{config.icon}</div>
                  <p style={{ fontSize: 14, fontWeight: 700, color }}>
                    {petName}'s {config.label.toLowerCase()} profile is complete!
                  </p>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
                    Mira uses this to personalise every recommendation
                  </p>
                </div>
              )}

              {/* Submitted answers */}
              {Object.keys(submitted).length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(submitted).map(([qId]) => {
                    const q = questions.find(x => x.question_id === qId);
                    const a = answers[qId];
                    return (
                      <span key={qId} style={{
                        fontSize: 11, padding: "4px 10px", borderRadius: 999,
                        background: `${color}12`, border: `1px solid ${color}30`,
                        color, display: "flex", alignItems: "center", gap: 4,
                      }}>
                        <Check size={10} /> {q?.question_text?.split("?")[0]?.slice(0, 25)}... : {Array.isArray(a) ? a.join(", ") : String(a)}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Full soul builder link */}
              <button onClick={() => { setDrawerOpen(false); window.location.href = "/soul-builder"; }}
                data-testid={`${pillar}-profile-full-link`}
                style={{
                  marginTop: 16, width: "100%", padding: 10, borderRadius: 12,
                  border: "1px solid #eee", background: "#fafafa",
                  color: "#999", fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                See full soul profile <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
