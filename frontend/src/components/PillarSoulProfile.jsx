/**
 * PillarSoulProfile.jsx — Reusable soul profile for ALL pillar pages
 * 3 sections: What Mira Knows (tiles) → Breed Intelligence → Questions (from API)
 * Based on GoSoulPage's TripProfile (the gold standard)
 */
import { useState, useCallback, useEffect } from "react";
import { Check, ChevronRight, Sparkles, X } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ── "What Mira Knows" tiles per pillar — uses ACTUAL DB keys ──
const PILLAR_TILES = {
  go: (soul, name) => [
    soul.usual_travel && { icon: "\u2708\uFE0F", label: "Travel Mode", value: soul.usual_travel },
    soul.car_rides && { icon: "\uD83D\uDE97", label: "Car Rides", value: soul.car_rides, urgent: soul.car_rides === "Gets motion sickness" },
    soul.hotel_experience && { icon: "\uD83C\uDFE8", label: "Hotel", value: soul.hotel_experience },
    soul.stay_preference && { icon: "\uD83C\uDFD5\uFE0F", label: "Stay Pref", value: soul.stay_preference },
    soul.separation_anxiety && soul.separation_anxiety !== "No" && { icon: "\uD83D\uDE1F", label: "Separation", value: soul.separation_anxiety, urgent: true },
    soul.energy_level && { icon: "\u26A1", label: "Energy", value: soul.energy_level },
    soul.food_allergies && !["none","no"].includes(String(Array.isArray(soul.food_allergies)?soul.food_allergies[0]:soul.food_allergies).toLowerCase()) && { icon: "\u26A0\uFE0F", label: "Allergy", value: Array.isArray(soul.food_allergies)?soul.food_allergies.join(", "):soul.food_allergies, urgent: true },
  ].filter(Boolean),
  dine: (soul, name) => [
    soul.diet_type && { icon: "\uD83C\uDF7D\uFE0F", label: "Diet", value: soul.diet_type },
    soul.favorite_protein && { icon: "\uD83E\uDD69", label: "Fave Protein", value: soul.favorite_protein },
    soul.food_motivation && { icon: "\uD83C\uDF56", label: "Food Drive", value: soul.food_motivation },
    soul.treat_preference && { icon: "\uD83C\uDF6A", label: "Treat Type", value: soul.treat_preference },
    soul.favorite_treats && { icon: "\u2B50", label: "Loves", value: Array.isArray(soul.favorite_treats)?soul.favorite_treats.join(", "):soul.favorite_treats },
    soul.sensitive_stomach && soul.sensitive_stomach !== "No" && { icon: "\uD83E\uDE7A", label: "Stomach", value: soul.sensitive_stomach, urgent: true },
    soul.food_allergies && !["none","no"].includes(String(Array.isArray(soul.food_allergies)?soul.food_allergies[0]:soul.food_allergies).toLowerCase()) && { icon: "\u26A0\uFE0F", label: "Allergy", value: Array.isArray(soul.food_allergies)?soul.food_allergies.join(", "):soul.food_allergies, urgent: true },
    soul.prefers_grain_free && { icon: "\uD83C\uDF3E", label: "Grain-Free", value: soul.prefers_grain_free === true ? "Yes" : "No" },
  ].filter(Boolean),
  care: (soul, name) => [
    soul.health_conditions && { icon: "\uD83E\uDE7A", label: "Health", value: Array.isArray(soul.health_conditions)?soul.health_conditions.join(", "):soul.health_conditions },
    soul.vet_comfort && { icon: "\uD83D\uDC89", label: "Vet Comfort", value: soul.vet_comfort },
    soul.grooming_tolerance && { icon: "\u2702\uFE0F", label: "Grooming", value: soul.grooming_tolerance },
    soul.groom_frequency && { icon: "\uD83D\uDCC5", label: "Groom Freq", value: soul.groom_frequency },
    soul.vaccinated && { icon: "\uD83D\uDEE1\uFE0F", label: "Vaccinated", value: Array.isArray(soul.vaccinated)?soul.vaccinated.join(", "):soul.vaccinated },
    soul.food_allergies && !["none","no"].includes(String(Array.isArray(soul.food_allergies)?soul.food_allergies[0]:soul.food_allergies).toLowerCase()) && { icon: "\u26A0\uFE0F", label: "Allergy", value: Array.isArray(soul.food_allergies)?soul.food_allergies.join(", "):soul.food_allergies, urgent: true },
    soul.sensitive_stomach && soul.sensitive_stomach !== "No" && { icon: "\uD83E\uDDB4", label: "Stomach", value: soul.sensitive_stomach },
  ].filter(Boolean),
  play: (soul, name) => [
    soul.energy_level && { icon: "\u26A1", label: "Energy", value: soul.energy_level },
    soul.exercise_needs && { icon: "\uD83C\uDFC3", label: "Exercise", value: soul.exercise_needs },
    soul.favorite_activity && { icon: "\uD83C\uDFBE", label: "Fave Activity", value: soul.favorite_activity },
    soul.play_style && { icon: "\uD83D\uDC3E", label: "Play Style", value: soul.play_style },
    soul.behavior_with_dogs && { icon: "\uD83D\uDC15", label: "With Dogs", value: soul.behavior_with_dogs },
    soul.walks_per_day && { icon: "\uD83D\uDEB6", label: "Walks/Day", value: soul.walks_per_day },
    soul.social_preference && { icon: "\uD83E\uDD1D", label: "Social Pref", value: soul.social_preference },
  ].filter(Boolean),
  learn: (soul, name) => [
    soul.training_level && { icon: "\uD83C\uDF93", label: "Training", value: soul.training_level },
    soul.motivation_type && { icon: "\uD83C\uDFAF", label: "Motivation", value: soul.motivation_type },
    soul.training_response && { icon: "\uD83D\uDC4F", label: "Responds To", value: soul.training_response },
    soul.leash_behavior && { icon: "\uD83E\uDEA2", label: "Leash", value: soul.leash_behavior },
    soul.behavior_issues && !["none","no"].includes(String(Array.isArray(soul.behavior_issues)?soul.behavior_issues[0]:soul.behavior_issues).toLowerCase()) && { icon: "\u26A0\uFE0F", label: "Issues", value: Array.isArray(soul.behavior_issues)?soul.behavior_issues.join(", "):soul.behavior_issues, urgent: true },
    soul.learn_level && { icon: "\uD83D\uDCDA", label: "Commands", value: Array.isArray(soul.learn_level)?soul.learn_level.join(", "):soul.learn_level },
    soul.barking && { icon: "\uD83D\uDD0A", label: "Barking", value: soul.barking },
  ].filter(Boolean),
  celebrate: (soul, name) => [
    soul.celebration_preferences && { icon: "\uD83C\uDF89", label: "Celebrations", value: Array.isArray(soul.celebration_preferences)?soul.celebration_preferences.join(", "):soul.celebration_preferences },
    soul.birthday_feast_style && { icon: "\uD83C\uDF82", label: "Cake Style", value: soul.birthday_feast_style },
    soul.loves_celebrations && { icon: "\u2764\uFE0F", label: "Loves Parties", value: soul.loves_celebrations === true ? "Yes!" : "Not yet" },
    soul.favorite_treats && { icon: "\uD83C\uDF6A", label: "Fave Treats", value: Array.isArray(soul.favorite_treats)?soul.favorite_treats.join(", "):soul.favorite_treats },
    soul.social_with_people && { icon: "\uD83E\uDD1D", label: "With People", value: soul.social_with_people },
    soul.attention_seeking && { icon: "\u2B50", label: "Attention", value: soul.attention_seeking },
  ].filter(Boolean),
  paperwork: (soul, name) => [
    soul.vaccinated && { icon: "\uD83D\uDCCB", label: "Vaccinated", value: Array.isArray(soul.vaccinated)?soul.vaccinated.join(", "):soul.vaccinated },
    soul.health_conditions && { icon: "\uD83E\uDE7A", label: "Health", value: Array.isArray(soul.health_conditions)?soul.health_conditions.join(", "):soul.health_conditions },
    soul.breed && { icon: "\uD83D\uDC36", label: "Breed", value: soul.breed },
    soul.life_stage && { icon: "\uD83D\uDCC5", label: "Life Stage", value: soul.life_stage },
  ].filter(Boolean),
  emergency: (soul, name) => [
    soul.health_conditions && { icon: "\uD83D\uDEA8", label: "Conditions", value: Array.isArray(soul.health_conditions)?soul.health_conditions.join(", "):soul.health_conditions },
    soul.food_allergies && !["none","no"].includes(String(Array.isArray(soul.food_allergies)?soul.food_allergies[0]:soul.food_allergies).toLowerCase()) && { icon: "\u26A0\uFE0F", label: "Allergy", value: Array.isArray(soul.food_allergies)?soul.food_allergies.join(", "):soul.food_allergies, urgent: true },
    soul.vet_comfort && { icon: "\uD83D\uDC89", label: "Vet Comfort", value: soul.vet_comfort },
    soul.vaccinated && { icon: "\uD83D\uDEE1\uFE0F", label: "Vaccinated", value: Array.isArray(soul.vaccinated)?soul.vaccinated.join(", "):soul.vaccinated },
    soul.loud_sounds && { icon: "\uD83D\uDD0A", label: "Loud Sounds", value: soul.loud_sounds },
  ].filter(Boolean),
  farewell: (soul, name) => [
    soul.life_stage && { icon: "\uD83C\uDF37", label: "Life Stage", value: soul.life_stage },
    soul.health_conditions && { icon: "\uD83E\uDE7A", label: "Health", value: Array.isArray(soul.health_conditions)?soul.health_conditions.join(", "):soul.health_conditions },
    soul.most_attached_to && { icon: "\u2764\uFE0F", label: "Most Attached", value: soul.most_attached_to },
    soul.dream_life && { icon: "\u2B50", label: "Dream Life", value: soul.dream_life },
  ].filter(Boolean),
  adopt: (soul, name) => [
    soul.behavior_with_dogs && { icon: "\uD83D\uDC15", label: "With Dogs", value: soul.behavior_with_dogs },
    soul.stranger_reaction && { icon: "\uD83D\uDC64", label: "Strangers", value: soul.stranger_reaction },
    soul.training_level && { icon: "\uD83C\uDF93", label: "Training", value: soul.training_level },
    soul.energy_level && { icon: "\u26A1", label: "Energy", value: soul.energy_level },
    soul.kids_at_home && { icon: "\uD83D\uDC76", label: "Kids", value: soul.kids_at_home },
  ].filter(Boolean),
  shop: (soul, name) => [
    soul.energy_level && { icon: "\u26A1", label: "Energy", value: soul.energy_level },
    soul.diet_type && { icon: "\uD83C\uDF7D\uFE0F", label: "Diet", value: soul.diet_type },
    soul.favorite_treats && { icon: "\uD83C\uDF6A", label: "Loves", value: Array.isArray(soul.favorite_treats)?soul.favorite_treats.join(", "):soul.favorite_treats },
    soul.grooming_tolerance && { icon: "\u2702\uFE0F", label: "Grooming", value: soul.grooming_tolerance },
    soul.food_allergies && !["none","no"].includes(String(Array.isArray(soul.food_allergies)?soul.food_allergies[0]:soul.food_allergies).toLowerCase()) && { icon: "\u26A0\uFE0F", label: "Allergy", value: Array.isArray(soul.food_allergies)?soul.food_allergies.join(", "):soul.food_allergies, urgent: true },
  ].filter(Boolean),
  services: (soul, name) => [
    soul.breed && { icon: "\uD83D\uDC36", label: "Breed", value: soul.breed },
    soul.energy_level && { icon: "\u26A1", label: "Energy", value: soul.energy_level },
    soul.training_level && { icon: "\uD83C\uDF93", label: "Training", value: soul.training_level },
    soul.health_conditions && { icon: "\uD83E\uDE7A", label: "Health", value: Array.isArray(soul.health_conditions)?soul.health_conditions.join(", "):soul.health_conditions },
  ].filter(Boolean),
};

// ── Pillar config ──
const PILLAR_CFG = {
  go:        { label: "Travel",      emoji: "\u2708\uFE0F",  color: "#3498DB" },
  dine:      { label: "Food",        emoji: "\uD83C\uDF7D\uFE0F", color: "#C9973A" },
  care:      { label: "Wellness",    emoji: "\uD83C\uDF3F",  color: "#40916C" },
  play:      { label: "Play",        emoji: "\uD83C\uDFBE",  color: "#E76F51" },
  learn:     { label: "Learning",    emoji: "\uD83C\uDF93",  color: "#7C3AED" },
  celebrate: { label: "Celebration", emoji: "\uD83C\uDF82",  color: "#A855F7" },
  paperwork: { label: "Documents",   emoji: "\uD83D\uDCC4",  color: "#0D9488" },
  emergency: { label: "Safety",      emoji: "\uD83D\uDEA8",  color: "#EF4444" },
  farewell:  { label: "Memory",      emoji: "\uD83C\uDF37",  color: "#8B5CF6" },
  adopt:     { label: "Adoption",    emoji: "\uD83D\uDC3E",  color: "#65A30D" },
  shop:      { label: "Shopping",    emoji: "\uD83D\uDED2",  color: "#F59E0B" },
  services:  { label: "Services",    emoji: "\uD83E\uDD1D",  color: "#0EA5E9" },
};

function getBreedTags(pet) {
  const tags = [];
  const soul = pet?.doggy_soul_answers || {};
  if (pet?.breed || soul.breed) tags.push({ icon: "\uD83D\uDC36", text: pet.breed || soul.breed });
  if (pet?.city) tags.push({ icon: "\uD83D\uDCCD", text: pet.city });
  const allg = Array.isArray(soul.food_allergies) ? soul.food_allergies : soul.food_allergies ? [soul.food_allergies] : [];
  allg.filter(a => a && !["none","no","none known"].includes(String(a).toLowerCase())).forEach(a => tags.push({ icon: "\u26A0\uFE0F", text: a }));
  if (soul.energy_level) tags.push({ icon: "\u26A1", text: soul.energy_level });
  return tags.slice(0, 5);
}

export default function PillarSoulProfile({ pet, token, pillar = "go", color: colorProp }) {
  const cfg = PILLAR_CFG[pillar] || { label: pillar, emoji: "\u2B50", color: "#0D9488" };
  const color = colorProp || cfg.color;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [liveScore, setLiveScore]   = useState(null);
  const [questions, setQuestions]    = useState([]);
  const [qLoading, setQLoading]     = useState(false);
  const [answers, setAnswers]       = useState({});
  const [submitting, setSubmitting]  = useState({});
  const [submitted, setSubmitted]    = useState({});
  const [totalPts, setTotalPts]      = useState(0);

  const petName = pet?.name || "your dog";
  const soul = pet?.doggy_soul_answers || {};
  const tags = getBreedTags(pet);
  const displayScore = liveScore ?? pet?.overall_score ?? 0;
  const scoreInt = Math.round(displayScore);

  // Get "What Mira Knows" tiles for this pillar
  const tilesFn = PILLAR_TILES[pillar] || (() => []);
  const miraTiles = tilesFn(soul, petName);

  const loadQuestions = useCallback(() => {
    if (!pet?.id) return;
    setQLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/quick-questions?limit=4&context=${pillar}`, {
      signal: ctrl.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        clearTimeout(timer);
        if (data) {
          setQuestions((data.questions || []).map(q => ({ ...q, pet_id: pet.id })));
          if (data.current_score !== undefined) setLiveScore(data.current_score);
        }
      })
      .catch(err => { if (err.name !== "AbortError") console.error(`[${cfg.label}Profile]`, err); })
      .finally(() => { clearTimeout(timer); setQLoading(false); });
  }, [pet?.id, pillar, cfg.label, token]);

  useEffect(() => { if (drawerOpen) loadQuestions(); }, [drawerOpen, loadQuestions]);

  // Reset state when pet changes
  useEffect(() => {
    setQuestions([]); setAnswers({}); setSubmitted({}); setTotalPts(0); setLiveScore(null);
  }, [pet?.id]);

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
        setTotalPts(p => p + 3);
        setSubmitted(p => ({ ...p, [q.question_id]: true }));
        if (data.scores?.overall !== undefined) {
          setLiveScore(prev => Math.max(prev ?? 0, data.scores.overall));
          window.dispatchEvent(new CustomEvent("soulScoreUpdated", { detail: { petId: pet.id, score: data.scores.overall } }));
        }
      }
    } catch (err) {
      console.error(`[${cfg.label}Profile submit]`, err);
    } finally {
      setSubmitting(p => ({ ...p, [q.question_id]: false }));
    }
  };

  const activeQs = questions.filter(q => !submitted[q.question_id]);
  const hasAnsweredData = miraTiles.length > 0;
  const isComplete = scoreInt >= 80 && activeQs.length === 0 && !qLoading;

  if (!pet) return null;

  return (
    <>
      {/* Compact profile bar */}
      <div onClick={() => setDrawerOpen(true)} data-testid={`${pillar}-profile-bar`}
        style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"12px 16px", borderRadius:14, cursor:"pointer",
          background:"#fff", border:"1px solid #e8e0d8",
          boxShadow:"0 1px 4px rgba(0,0,0,0.04)", marginBottom:16, transition:"box-shadow 0.2s",
        }}>
        {pet?.photo_url && (
          <img src={pet.photo_url} alt={petName}
            style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", border:`2px solid ${color}30` }} />
        )}
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#1A0A00" }}>
            {petName}'s {cfg.label} Profile
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:4 }}>
            {tags.map((t, i) => (
              <span key={i} style={{ fontSize:10, padding:"2px 8px", borderRadius:999, background:"#f5f0ea", color:"#666", display:"flex", alignItems:"center", gap:3 }}>
                {t.icon} {t.text}
              </span>
            ))}
          </div>
        </div>
        <div style={{ fontSize:12, fontWeight:600, color, whiteSpace:"nowrap" }}>
          Mira's picks <ChevronRight size={14} style={{ display:"inline", verticalAlign:"middle" }} />
        </div>
      </div>

      {/* Drawer modal */}
      {drawerOpen && (
        <div onClick={() => setDrawerOpen(false)}
          style={{ position:"fixed", inset:0, zIndex:50001, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div onClick={e => e.stopPropagation()} data-testid={`${pillar}-profile-drawer`}
            style={{ width:"min(580px,100%)", maxHeight:"85vh", overflowY:"auto", borderRadius:20, background:"#fff", boxShadow:"0 24px 60px rgba(0,0,0,0.25)" }}>

            {/* Header */}
            <div style={{ padding:"20px 24px 16px", borderBottom:"1px solid #eee", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"#fff", zIndex:2, borderRadius:"20px 20px 0 0" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:"#999", textTransform:"uppercase" }}>
                  {cfg.emoji} {petName}'s {cfg.label} Profile
                </div>
                <div style={{ fontSize:24, fontWeight:900, color:"#111", marginTop:4 }}>
                  {scoreInt}%
                  {totalPts > 0 && <span style={{ fontSize:12, color, fontWeight:600, marginLeft:8 }}><Sparkles size={12} style={{ display:"inline", verticalAlign:"middle" }} /> +{totalPts} pts</span>}
                </div>
                <div style={{ width:120, height:4, borderRadius:999, background:"#eee", marginTop:6 }}>
                  <div style={{ height:"100%", borderRadius:999, background:color, width:`${Math.min(scoreInt,100)}%`, transition:"width 0.6s ease" }} />
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} data-testid={`${pillar}-profile-close`}
                style={{ width:32, height:32, borderRadius:10, border:"1px solid #eee", background:"#fafafa", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16} color="#999" />
              </button>
            </div>

            <div style={{ padding:"16px 24px 24px" }}>

              {/* SECTION 1: What Mira Knows — pet soul tiles */}
              {hasAnsweredData && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:"#999", textTransform:"uppercase", marginBottom:10 }}>
                    What Mira knows about {petName}
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {miraTiles.map((t, i) => (
                      <div key={i} data-testid={`${pillar}-tile-${t.label.replace(/\s+/g,'-').toLowerCase()}`}
                        style={{
                          padding:"8px 12px", borderRadius:12, fontSize:12, display:"flex", alignItems:"center", gap:6,
                          background: t.urgent ? "#FEF2F2" : "#f5f0ea",
                          border: t.urgent ? "1px solid #FECACA" : "1px solid #e8e0d8",
                          color: t.urgent ? "#B91C1C" : "#555",
                        }}>
                        <span>{t.icon}</span>
                        <span style={{ fontWeight:600 }}>{t.label}:</span>
                        <span>{t.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 2: Breed tags */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
                {tags.map((t, i) => (
                  <span key={i} style={{ fontSize:11, padding:"4px 10px", borderRadius:999, background:"#f5f0ea", color:"#555", display:"flex", alignItems:"center", gap:4 }}>
                    {t.icon} {t.text}
                  </span>
                ))}
              </div>

              {/* SECTION 3: Questions from backend API */}
              {qLoading && (
                <div style={{ textAlign:"center", padding:20, color:"#999", fontSize:13 }}>
                  Loading {petName}'s questions...
                </div>
              )}

              {!qLoading && activeQs.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:"0.08em", color:"#999", textTransform:"uppercase", marginBottom:10 }}>
                    Help Mira know {petName} better
                  </div>
                  {activeQs.map(q => {
                    const qId = q.question_id;
                    const hasAns = answers[qId] && (Array.isArray(answers[qId]) ? answers[qId].length > 0 : true);
                    return (
                      <div key={qId} data-testid={`${pillar}-q-${qId}`}
                        style={{ background:"#fafafa", borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"#333", marginBottom:10, lineHeight:1.4 }}>
                          {q.question_text}
                        </div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {(q.options || []).map(opt => {
                            const sel = q.type === "multi_select" ? (answers[qId] || []).includes(opt) : answers[qId] === opt;
                            return (
                              <button key={opt} onClick={() => handleAnswer(qId, opt, q.type)}
                                style={{
                                  padding:"5px 12px", borderRadius:20, fontSize:12, cursor:"pointer",
                                  border: sel ? `1.5px solid ${color}` : "1px solid #ddd",
                                  background: sel ? `${color}10` : "#fff",
                                  color: sel ? color : "#666", fontWeight: sel ? 600 : 400, transition:"all 0.15s",
                                }}>{opt}</button>
                            );
                          })}
                        </div>
                        {hasAns && (
                          <button onClick={() => handleSubmit(q)} disabled={submitting[qId]}
                            style={{
                              marginTop:10, display:"flex", alignItems:"center", gap:6,
                              padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600,
                              background:color, color:"#fff", border:"none", cursor:"pointer",
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

              {/* Submitted answers */}
              {Object.keys(submitted).length > 0 && (
                <div style={{ marginTop:12, display:"flex", flexWrap:"wrap", gap:6 }}>
                  {Object.entries(submitted).map(([qId]) => {
                    const q = questions.find(x => x.question_id === qId);
                    const a = answers[qId];
                    return (
                      <span key={qId} style={{ fontSize:11, padding:"4px 10px", borderRadius:999, background:`${color}12`, border:`1px solid ${color}30`, color, display:"flex", alignItems:"center", gap:4 }}>
                        <Check size={10} /> {Array.isArray(a) ? a.join(", ") : String(a)}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Complete state */}
              {!qLoading && isComplete && (
                <div style={{ textAlign:"center", padding:"16px 0", color:"#999" }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>{cfg.emoji}</div>
                  <p style={{ fontSize:14, fontWeight:700, color }}>{petName}'s {cfg.label.toLowerCase()} profile is complete!</p>
                  <p style={{ fontSize:12, color:"#aaa", marginTop:4 }}>Mira uses this to personalise every recommendation</p>
                </div>
              )}

              {/* Not complete + no questions → invite */}
              {!qLoading && !isComplete && activeQs.length === 0 && !hasAnsweredData && (
                <div style={{ textAlign:"center", padding:"16px 0", color:"#999" }}>
                  <p style={{ fontSize:13 }}>Tell Mira about {petName} to get personalised picks</p>
                </div>
              )}

              <button onClick={() => { setDrawerOpen(false); window.location.href = "/soul-builder"; }}
                data-testid={`${pillar}-profile-full-link`}
                style={{ marginTop:16, width:"100%", padding:10, borderRadius:12, border:"1px solid #eee", background:"#fafafa", color:"#999", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                See full soul profile <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
