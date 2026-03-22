/**
 * SoulChapterModal.jsx — Chapter-specific modal for /pet-home Soul Chapter cards
 * Shows: What Mira knows (answered) + What Mira wants to know (unanswered) + live scoring
 * 
 * KEYS MATCH ACTUAL doggy_soul_answers fields from the DB
 */
import { useState, useCallback, useEffect } from "react";
import { Check, X, ChevronRight, Sparkles } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ── Correct key-to-label mapping matching ACTUAL DB fields ──
const CHAPTER_QUESTIONS = {
  identity: [
    { id: "life_stage", label: "Life Stage" },
    { id: "age_stage", label: "Age Stage" },
    { id: "gender", label: "Gender" },
    { id: "energy_level", label: "Energy Level" },
    { id: "general_nature", label: "Nature" },
    { id: "describe_3_words", label: "Personality" },
    { id: "temperament", label: "Temperament" },
    { id: "breed", label: "Breed" },
  ],
  behaviour: [
    { id: "morning_routine", label: "Morning Routine" },
    { id: "feeding_times", label: "Feeding Times" },
    { id: "exercise_needs", label: "Exercise Needs" },
    { id: "walks_per_day", label: "Daily Walks" },
    { id: "energetic_time", label: "Peak Energy" },
    { id: "sleep_location", label: "Sleep Spot" },
    { id: "alone_comfort", label: "Alone Comfort" },
    { id: "separation_anxiety", label: "Separation Anxiety" },
    { id: "crate_trained", label: "Crate Trained" },
    { id: "car_rides", label: "Car Rides" },
    { id: "favorite_spot", label: "Favourite Spot" },
    { id: "favorite_item", label: "Favourite Item" },
    { id: "space_preference", label: "Space Preference" },
  ],
  health: [
    { id: "health_conditions", label: "Health Conditions" },
    { id: "food_allergies", label: "Food Allergies" },
    { id: "sensitive_stomach", label: "Stomach" },
    { id: "vaccinated", label: "Vaccinated" },
    { id: "vet_comfort", label: "Vet Comfort" },
    { id: "grooming_tolerance", label: "Grooming" },
    { id: "prefers_grain_free", label: "Grain-Free" },
    { id: "groom_frequency", label: "Groom Frequency" },
  ],
  social: [
    { id: "behavior_with_dogs", label: "With Other Dogs" },
    { id: "stranger_reaction", label: "Stranger Reaction" },
    { id: "social_with_people", label: "People Comfort" },
    { id: "kids_at_home", label: "Kids at Home" },
    { id: "lives_with", label: "Lives With" },
    { id: "other_pets", label: "Other Pets" },
    { id: "most_attached_to", label: "Most Attached To" },
    { id: "attention_seeking", label: "Attention Seeker" },
    { id: "handling_comfort", label: "Handling Comfort" },
    { id: "loud_sounds", label: "Sound Sensitivity" },
  ],
  nutrition: [
    { id: "diet_type", label: "Diet Type" },
    { id: "food_motivation", label: "Food Motivation" },
    { id: "favorite_protein", label: "Favourite Protein" },
    { id: "treat_preference", label: "Treat Type" },
    { id: "favorite_treats", label: "Favourite Treats" },
    { id: "food_allergies", label: "Food Allergies" },
    { id: "sensitive_stomach", label: "Stomach" },
  ],
  learning: [
    { id: "training_level", label: "Training Level" },
    { id: "motivation_type", label: "Motivation" },
    { id: "leash_behavior", label: "Leash Behaviour" },
    { id: "barking", label: "Barking" },
    { id: "behavior_issues", label: "Behaviour Issues" },
    { id: "training_response", label: "Training Response" },
    { id: "learn_level", label: "Commands Known" },
    { id: "learn_focus", label: "Session Focus" },
  ],
};

function formatVal(v) {
  if (!v) return null;
  if (v === true) return "Yes";
  if (v === false) return "No";
  if (Array.isArray(v)) {
    const f = v.filter(x => x && !["none","no"].includes(String(x).toLowerCase()));
    return f.length > 0 ? f.join(", ") : null;
  }
  const s = String(v);
  if (["none","unknown",""].includes(s.toLowerCase())) return null;
  return s;
}

export default function SoulChapterModal({ chapter, pet, token, onClose, onScoreUpdated }) {
  const [questions, setQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [totalPts, setTotalPts] = useState(0);

  const chapterId = chapter?.id;
  const petId = pet?.id;

  // Load questions from backend API
  const loadQuestions = useCallback(() => {
    if (!petId || !chapterId) return;
    setQLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    fetch(`${API_URL}/api/pet-soul/profile/${petId}/quick-questions?limit=6&context=${chapterId}`, {
      signal: ctrl.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        clearTimeout(timer);
        if (data?.questions) setQuestions(data.questions);
      })
      .catch(err => { if (err.name !== "AbortError") console.error("[SoulChapter]", err); })
      .finally(() => { clearTimeout(timer); setQLoading(false); });
  }, [petId, chapterId, token]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // Early return AFTER all hooks
  if (!chapter || !pet) return null;

  const soul = pet.doggy_soul_answers || {};
  const petName = pet.name || "your dog";
  const chapterKeys = CHAPTER_QUESTIONS[chapter.id] || [];

  // Split answered vs unanswered using CORRECT DB keys
  const answeredTiles = chapterKeys
    .map(q => ({ ...q, value: formatVal(soul[q.id]) }))
    .filter(q => q.value && !submitted[q.id]);

  const unansweredKeys = chapterKeys
    .filter(q => !formatVal(soul[q.id]) && !submitted[q.id])
    .map(q => q.id);

  const totalQ = chapterKeys.length;
  const answeredCount = answeredTiles.length + Object.keys(submitted).length;
  const score = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;
  const isComplete = score >= 80 && unansweredKeys.length === 0;

  const handleSelect = (qId, val, type) => {
    setAnswers(prev => {
      if (type === "multi_select") {
        const cur = prev[qId] || [];
        return { ...prev, [qId]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
      }
      return { ...prev, [qId]: val };
    });
  };

  const handleSubmit = async (q) => {
    const qId = q.question_id || q.id;
    const answer = answers[qId];
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return;
    setSubmitting(p => ({ ...p, [qId]: true }));
    try {
      const res = await fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ question_id: qId, answer }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmitted(p => ({ ...p, [qId]: answer }));
        setTotalPts(p => p + 3);
        if (data.scores?.overall !== undefined && onScoreUpdated) {
          onScoreUpdated(data.scores.overall);
        }
      }
    } catch (err) {
      console.error("[SoulChapter submit]", err);
    } finally {
      setSubmitting(p => ({ ...p, [qId]: false }));
    }
  };

  // Filter backend questions to only show ones not already answered
  const activeQuestions = questions.filter(q => !submitted[q.question_id] && !formatVal(soul[q.question_id]));

  return (
    <div onClick={onClose} data-testid={`soul-chapter-modal-${chapter.id}`}
      style={{ position:"fixed", inset:0, zIndex:50001, background:"rgba(0,0,0,0.78)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width:"min(680px,100%)", maxHeight:"90vh", overflowY:"auto", borderRadius:20, background:"#111016", border:`1.5px solid ${chapter.color}40`, boxShadow:`0 24px 80px rgba(0,0,0,0.6), 0 0 40px ${chapter.color}15` }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 16px", background:`linear-gradient(135deg, #111016 0%, ${chapter.color}12 100%)`, borderRadius:"20px 20px 0 0", position:"sticky", top:0, zIndex:2 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:24 }}>{chapter.emoji}</span>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:chapter.color }}>{chapter.label}</div>
                <div style={{ fontSize:11, color:"rgba(245,240,232,0.45)" }}>{answeredCount}/{totalQ} answered</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ textAlign:"right" }}>
                <span style={{ fontSize:28, fontWeight:900, color: score >= 80 ? chapter.color : "rgba(245,240,232,0.6)" }}>{score}</span>
                <span style={{ fontSize:14, color:"rgba(245,240,232,0.3)" }}>%</span>
              </div>
              <button onClick={onClose} data-testid="soul-chapter-modal-close"
                style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(245,240,232,0.5)" }}>
                <X size={16} />
              </button>
            </div>
          </div>
          <div style={{ height:4, borderRadius:999, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:999, background:chapter.color, width:`${score}%`, transition:"width 0.8s ease" }} />
          </div>
          {totalPts > 0 && (
            <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6, fontSize:11, color:chapter.color, fontWeight:600 }}>
              <Sparkles size={12} /> +{totalPts} pts added
            </div>
          )}
        </div>

        <div style={{ padding:"16px 24px 24px" }}>

          {/* SECTION 1: What Mira Knows — tiles from REAL soul answers */}
          {(answeredTiles.length > 0 || Object.keys(submitted).length > 0) && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"rgba(245,240,232,0.3)", marginBottom:10 }}>
                What Mira knows
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
                {answeredTiles.map(q => (
                  <div key={q.id} data-testid={`chapter-answer-${q.id}`}
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"10px 12px" }}>
                    <div style={{ fontSize:10, fontWeight:600, color:chapter.color, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.05em" }}>{q.label}</div>
                    <div style={{ fontSize:13, color:"rgba(245,240,232,0.75)", lineHeight:1.4 }}>{q.value}</div>
                  </div>
                ))}
                {Object.entries(submitted).map(([qId, val]) => {
                  const q = chapterKeys.find(x => x.id === qId) || questions.find(x => x.question_id === qId);
                  return (
                    <div key={qId} data-testid={`chapter-answer-${qId}`}
                      style={{ background:`${chapter.color}10`, border:`1px solid ${chapter.color}30`, borderRadius:12, padding:"10px 12px" }}>
                      <div style={{ fontSize:10, fontWeight:600, color:chapter.color, marginBottom:3, textTransform:"uppercase", letterSpacing:"0.05em" }}>{q?.label || q?.question_text?.split("?")[0]?.slice(0,25) || qId}</div>
                      <div style={{ fontSize:13, color:"rgba(245,240,232,0.75)", lineHeight:1.4, display:"flex", alignItems:"center", gap:4 }}>
                        <Check size={12} style={{ color:chapter.color }} />
                        {Array.isArray(val) ? val.join(", ") : String(val)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: What Mira wants to know — from backend API */}
          {qLoading && (
            <div style={{ textAlign:"center", padding:20, color:"rgba(245,240,232,0.4)", fontSize:13 }}>
              Loading {petName}'s questions...
            </div>
          )}
          {!qLoading && activeQuestions.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"rgba(245,240,232,0.3)", marginBottom:10 }}>
                Tell Mira more
              </div>
              {activeQuestions.map(q => {
                const qId = q.question_id;
                const hasAns = answers[qId] && (Array.isArray(answers[qId]) ? answers[qId].length > 0 : true);
                return (
                  <div key={qId} data-testid={`chapter-question-${qId}`}
                    style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"rgba(245,240,232,0.8)", marginBottom:10, lineHeight:1.4 }}>
                      {q.question_text}
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {(q.options || []).map(opt => {
                        const sel = q.type === "multi_select"
                          ? (answers[qId] || []).includes(opt) : answers[qId] === opt;
                        return (
                          <button key={opt} onClick={() => handleSelect(qId, opt, q.type)}
                            style={{
                              padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:500, cursor:"pointer",
                              border: sel ? `1.5px solid ${chapter.color}` : "1px solid rgba(255,255,255,0.1)",
                              background: sel ? `${chapter.color}20` : "rgba(255,255,255,0.03)",
                              color: sel ? chapter.color : "rgba(245,240,232,0.55)",
                              transition:"all 0.15s",
                            }}>{opt}</button>
                        );
                      })}
                    </div>
                    {hasAns && (
                      <button onClick={() => handleSubmit(q)} disabled={submitting[qId]}
                        style={{
                          marginTop:10, display:"flex", alignItems:"center", gap:6,
                          padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
                          background:chapter.color, color:"#fff", border:"none", cursor:"pointer",
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

          {/* Complete state — only when ACTUALLY complete */}
          {!qLoading && isComplete && answeredTiles.length > 0 && (
            <div style={{ textAlign:"center", padding:"16px 0 8px" }}>
              <div style={{ fontSize:24, marginBottom:8 }}>{chapter.emoji}</div>
              <p style={{ fontSize:14, fontWeight:700, color:chapter.color }}>{petName}'s {chapter.label.toLowerCase()} profile is complete</p>
              <p style={{ fontSize:12, color:"rgba(245,240,232,0.35)", marginTop:4 }}>Mira uses this to personalise every recommendation</p>
            </div>
          )}

          <button onClick={() => { onClose(); window.location.href = `/soul-builder?chapter=${chapter.id}`; }}
            data-testid="soul-chapter-full-builder-link"
            style={{ marginTop:16, width:"100%", padding:"10px", borderRadius:12, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"rgba(245,240,232,0.4)", fontSize:12, fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            See full Soul Builder <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
