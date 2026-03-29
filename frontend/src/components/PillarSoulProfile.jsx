/**
 * PillarSoulProfile.jsx — Shared profile component for ALL 12 pillars
 *
 * Shows:
 *   Section 1 — What Mira knows (soul answer tiles, pillar-specific)
 *   Section 2 — Breed tips (pillar-aware)
 *   Section 3 — MiraImaginesBreed cards (allergen-safe)
 *   Section 4 — Soul questions from backend (with points, live score)
 *   Footer    — "See full profile" → /my-pets
 */
import { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import MiraImaginesBreed from './common/MiraImaginesBreed';
import { useConcierge } from '../hooks/useConcierge';

const API = process.env.REACT_APP_BACKEND_URL;

// ── Allergy helpers ──
const ALLERGY_CLEAN = /^(no|none|none_confirmed|no_allergies|no allergies|na|n\/a|unknown)$/i;
function getAllergies(pet) {
  const s = new Set();
  const push = (v) => {
    if (!v) return;
    (Array.isArray(v) ? v : String(v).split(/,|;/).map(x => x.trim()))
      .forEach(a => { if (a && !ALLERGY_CLEAN.test(a.trim())) s.add(a.toLowerCase()); });
  };
  const soul = pet?.doggy_soul_answers || {};
  push(pet?.allergies); push(soul.food_allergies); push(soul.allergies);
  return [...s];
}

// ── What Mira knows — tile maps per pillar (ACTUAL DB keys) ──
function getMiraTiles(pillar, soul, name) {
  const fmt = v => v ? String(v).replace(/_/g,' ') : null;
  const fmtArr = v => Array.isArray(v) ? v.join(', ') : fmt(v);
  const maps = {
    care: [
      soul.food_allergies && !ALLERGY_CLEAN.test(String(fmtArr(soul.food_allergies))) && { icon:'\u26A0\uFE0F', label:'Allergy', value:`No ${fmtArr(soul.food_allergies)} — ever`, urgent:true },
      soul.health_conditions && !['none','healthy'].includes(String(fmtArr(soul.health_conditions)).toLowerCase()) && { icon:'\uD83D\uDC8A', label:'Condition', value:fmtArr(soul.health_conditions), urgent:true },
      soul.vet_comfort && { icon:'\uD83C\uDFE5', label:'Vet comfort', value:fmt(soul.vet_comfort) },
      soul.grooming_tolerance && { icon:'\u2702\uFE0F', label:'Grooming', value:fmt(soul.grooming_tolerance) },
      soul.groom_frequency && { icon:'\uD83D\uDCC5', label:'Groom freq', value:fmt(soul.groom_frequency) },
      soul.vaccinated && { icon:'\uD83D\uDEE1\uFE0F', label:'Vaccinated', value:fmtArr(soul.vaccinated) },
      soul.sensitive_stomach && soul.sensitive_stomach !== 'No' && { icon:'\uD83E\uDDB4', label:'Stomach', value:fmt(soul.sensitive_stomach) },
    ],
    dine: [
      soul.food_allergies && !ALLERGY_CLEAN.test(String(fmtArr(soul.food_allergies))) && { icon:'\u26A0\uFE0F', label:'Allergy', value:`No ${fmtArr(soul.food_allergies)} — NEVER`, urgent:true },
      soul.diet_type && { icon:'\uD83C\uDF7D\uFE0F', label:'Diet', value:fmt(soul.diet_type) },
      soul.favorite_protein && { icon:'\uD83E\uDD69', label:'Fave protein', value:fmt(soul.favorite_protein) },
      soul.food_motivation && { icon:'\uD83C\uDF56', label:'Food drive', value:fmt(soul.food_motivation) },
      soul.treat_preference && { icon:'\uD83C\uDF6A', label:'Treat type', value:fmt(soul.treat_preference) },
      soul.favorite_treats && { icon:'\u2B50', label:'Loves', value:fmtArr(soul.favorite_treats) },
      soul.sensitive_stomach && soul.sensitive_stomach !== 'No' && { icon:'\uD83E\uDE7A', label:'Stomach', value:fmt(soul.sensitive_stomach), urgent:true },
      soul.prefers_grain_free && { icon:'\uD83C\uDF3E', label:'Grain-free', value: soul.prefers_grain_free === true ? 'Yes' : fmt(soul.prefers_grain_free) },
    ],
    go: [
      soul.usual_travel && { icon:'\u2708\uFE0F', label:'Travel mode', value:fmt(soul.usual_travel) },
      soul.car_rides && { icon:'\uD83D\uDE97', label:'Car rides', value:fmt(soul.car_rides), urgent: soul.car_rides === 'Gets motion sickness' },
      soul.hotel_experience && { icon:'\uD83C\uDFE8', label:'Hotel exp', value:fmt(soul.hotel_experience) },
      soul.stay_preference && { icon:'\uD83C\uDFD5\uFE0F', label:'Stay pref', value:fmt(soul.stay_preference) },
      soul.separation_anxiety && soul.separation_anxiety !== 'No' && { icon:'\uD83D\uDE1F', label:'Separation', value:fmt(soul.separation_anxiety), urgent:true },
      soul.energy_level && { icon:'\u26A1', label:'Energy', value:fmt(soul.energy_level) },
      soul.food_allergies && !ALLERGY_CLEAN.test(String(fmtArr(soul.food_allergies))) && { icon:'\u26A0\uFE0F', label:'Allergy', value:fmtArr(soul.food_allergies), urgent:true },
    ],
    play: [
      soul.energy_level && { icon:'\u26A1', label:'Energy', value:fmt(soul.energy_level) },
      soul.exercise_needs && { icon:'\uD83C\uDFC3', label:'Exercise', value:fmt(soul.exercise_needs) },
      soul.favorite_activity && { icon:'\uD83C\uDFBE', label:'Fave activity', value:fmt(soul.favorite_activity) },
      soul.play_style && { icon:'\uD83D\uDC3E', label:'Play style', value:fmt(soul.play_style) },
      soul.behavior_with_dogs && { icon:'\uD83D\uDC15', label:'With dogs', value:fmt(soul.behavior_with_dogs) },
      soul.walks_per_day && { icon:'\uD83D\uDEB6', label:'Walks/day', value:fmt(soul.walks_per_day) },
    ],
    learn: [
      soul.training_level && { icon:'\uD83C\uDF93', label:'Training', value:fmt(soul.training_level) },
      soul.motivation_type && { icon:'\uD83C\uDFAF', label:'Motivation', value:fmt(soul.motivation_type) },
      soul.training_response && { icon:'\uD83D\uDC4F', label:'Responds to', value:fmt(soul.training_response) },
      soul.leash_behavior && { icon:'\uD83E\uDEA2', label:'Leash', value:fmt(soul.leash_behavior) },
      soul.behavior_issues && !['none','no'].includes(String(fmtArr(soul.behavior_issues)).toLowerCase()) && { icon:'\u26A0\uFE0F', label:'Working on', value:fmtArr(soul.behavior_issues), urgent:true },
      soul.learn_level && { icon:'\uD83D\uDCDA', label:'Commands', value:fmtArr(soul.learn_level) },
      soul.barking && { icon:'\uD83D\uDD0A', label:'Barking', value:fmt(soul.barking) },
    ],
    celebrate: [
      soul.celebration_preferences && { icon:'\uD83C\uDF89', label:'Celebrations', value:fmtArr(soul.celebration_preferences) },
      soul.birthday_feast_style && { icon:'\uD83C\uDF82', label:'Cake style', value:fmt(soul.birthday_feast_style) },
      soul.favorite_treats && { icon:'\uD83C\uDF6A', label:'Fave treats', value:fmtArr(soul.favorite_treats) },
      soul.food_allergies && !ALLERGY_CLEAN.test(String(fmtArr(soul.food_allergies))) && { icon:'\u26A0\uFE0F', label:'Not in cake', value:`No ${fmtArr(soul.food_allergies)}`, urgent:true },
      soul.social_with_people && { icon:'\uD83E\uDD1D', label:'With people', value:fmt(soul.social_with_people) },
      soul.attention_seeking && { icon:'\u2B50', label:'Attention', value:fmt(soul.attention_seeking) },
    ],
    shop: [
      soul.food_allergies && !ALLERGY_CLEAN.test(String(fmtArr(soul.food_allergies))) && { icon:'\u26A0\uFE0F', label:'Allergy', value:`No ${fmtArr(soul.food_allergies)}`, urgent:true },
      soul.energy_level && { icon:'\u26A1', label:'Energy', value:fmt(soul.energy_level) },
      soul.diet_type && { icon:'\uD83C\uDF7D\uFE0F', label:'Diet', value:fmt(soul.diet_type) },
      soul.favorite_treats && { icon:'\uD83C\uDF6A', label:'Loves', value:fmtArr(soul.favorite_treats) },
      soul.grooming_tolerance && { icon:'\u2702\uFE0F', label:'Grooming', value:fmt(soul.grooming_tolerance) },
    ],
    paperwork: [
      soul.vaccinated && { icon:'\uD83D\uDCCB', label:'Vaccinated', value:fmtArr(soul.vaccinated) },
      soul.health_conditions && !['none','healthy'].includes(String(fmtArr(soul.health_conditions)).toLowerCase()) && { icon:'\uD83D\uDC8A', label:'Medical note', value:fmtArr(soul.health_conditions), urgent:true },
      soul.breed && { icon:'\uD83D\uDC36', label:'Breed', value:fmt(soul.breed) },
      soul.life_stage && { icon:'\uD83D\uDCC5', label:'Life stage', value:fmt(soul.life_stage) },
    ],
    emergency: [
      soul.food_allergies && !ALLERGY_CLEAN.test(String(fmtArr(soul.food_allergies))) && { icon:'\u26A0\uFE0F', label:'ALLERGY', value:`No ${fmtArr(soul.food_allergies)} — CRITICAL`, urgent:true },
      soul.health_conditions && !['none','healthy'].includes(String(fmtArr(soul.health_conditions)).toLowerCase()) && { icon:'\uD83D\uDC8A', label:'Condition', value:fmtArr(soul.health_conditions), urgent:true },
      soul.vet_comfort && { icon:'\uD83D\uDE30', label:'Vet anxiety', value:fmt(soul.vet_comfort) },
      soul.vaccinated && { icon:'\uD83D\uDEE1\uFE0F', label:'Vaccinated', value:fmtArr(soul.vaccinated) },
      soul.loud_sounds && { icon:'\uD83D\uDD0A', label:'Loud sounds', value:fmt(soul.loud_sounds) },
    ],
    farewell: [
      soul.life_stage && { icon:'\uD83C\uDF38', label:'Life stage', value:fmt(soul.life_stage) },
      soul.health_conditions && !['none','healthy'].includes(String(fmtArr(soul.health_conditions)).toLowerCase()) && { icon:'\uD83D\uDC8A', label:'Condition', value:fmtArr(soul.health_conditions), urgent:true },
      soul.most_attached_to && { icon:'\u2764\uFE0F', label:'Most attached', value:fmt(soul.most_attached_to) },
      { icon:'\uD83C\uDF37', label:'Note', value:`Mira is here with ${name} and you.` },
    ],
    adopt: [
      soul.behavior_with_dogs && { icon:'\uD83D\uDC15', label:'With dogs', value:fmt(soul.behavior_with_dogs), urgent: String(soul.behavior_with_dogs).toLowerCase()==='reactive' },
      soul.stranger_reaction && { icon:'\uD83D\uDC64', label:'Strangers', value:fmt(soul.stranger_reaction) },
      soul.separation_anxiety && soul.separation_anxiety !== 'No' && { icon:'\uD83C\uDFE0', label:'Alone', value:`Separation: ${fmt(soul.separation_anxiety)}`, urgent: String(soul.separation_anxiety).toLowerCase()==='severe' },
      soul.training_level && { icon:'\uD83C\uDF93', label:'Training', value:fmt(soul.training_level) },
      soul.energy_level && { icon:'\u26A1', label:'Energy', value:fmt(soul.energy_level) },
    ],
    services: [
      soul.energy_level && { icon:'\u26A1', label:'Energy', value:fmt(soul.energy_level) },
      soul.grooming_tolerance && { icon:'\u2702\uFE0F', label:'Grooming', value:fmt(soul.grooming_tolerance) },
      soul.stranger_reaction && { icon:'\uD83D\uDC65', label:'Strangers', value:fmt(soul.stranger_reaction) },
      soul.food_allergies && !ALLERGY_CLEAN.test(String(fmtArr(soul.food_allergies))) && { icon:'\u26A0\uFE0F', label:'Allergy', value:`No ${fmtArr(soul.food_allergies)}`, urgent:true },
      soul.training_level && { icon:'\uD83C\uDF93', label:'Training', value:fmt(soul.training_level) },
    ],
  };
  return (maps[pillar] || []).filter(Boolean);
}

// ── Breed tips per pillar ──
function getBreedTip(pillar, breed, name) {
  const b = (breed || '').toLowerCase();
  const tips = {
    care: { 'indie':'Indie dogs have hardy coats — monthly grooming is usually enough.', 'labrador':'Labs shed heavily — regular brushing reduces shedding significantly.', 'golden retriever':'Golden Retrievers need brushing 2-3 times a week to prevent matting.', 'shih tzu':'Shih Tzu coats need professional grooming every 4-6 weeks.', 'poodle':'Poodle coats grow continuously — professional grooming every 6-8 weeks.', default:`Regular grooming keeps ${name} healthy, comfortable, and looking their best.` },
    dine: { 'indie':'Indie dogs do well on high-protein diets — hardy stomachs but watch portions.', 'labrador':'Labs are prone to obesity — measure every meal and limit treats.', 'beagle':'Beagles will eat anything — keep food secured and portions strict.', 'shih tzu':'Shih Tzus can be picky eaters — small, frequent meals work best.', default:`Good nutrition is the foundation of ${name}'s health. Mira checks every recommendation.` },
    go: { 'indie':'Indie dogs are natural explorers — they adapt well to new environments.', 'labrador':'Labradors are ideal travel companions — they love new people and places.', 'beagle':'Beagles follow their nose — always keep them leashed in new places.', 'shih tzu':'Shih Tzus prefer short trips — they do best in cool, calm environments.', default:`${name} deserves to see the world with you. Mira finds places that truly welcome dogs.` },
    play: { 'indie':'Indie dogs love sniff walks — mental stimulation is as important as physical exercise.', 'labrador':'Labs need 1-2 hours of exercise daily — they thrive with fetch and swimming.', 'golden retriever':'Golden Retrievers love to retrieve — fetch, frisbee, and swimming are ideal.', 'shih tzu':'Shih Tzus do well with short play sessions — 20-30 minutes twice a day.', 'beagle':'Beagles need to follow scent trails — puzzle feeders and sniff games are perfect.', default:`${name}'s play needs are unique to their breed and personality. Mira knows both.` },
    learn: { 'indie':'Indie dogs are smart and adaptive — positive reinforcement works best.', 'labrador':'Labradors are eager to please — they train quickly with food rewards.', 'golden retriever':'Golden Retrievers love to learn — consistent daily training sessions work best.', 'beagle':'Beagles are scent-driven — keep training sessions short and reward-focused.', 'shih tzu':'Shih Tzus can be stubborn — patience and very short sessions work best.', 'poodle':'Poodles are highly intelligent — they need mental challenges or they get bored.', default:`${name} learns best when training feels like play. Mira recommends the right trainer.` },
    celebrate: { 'indie':'Indie dogs love simple celebrations — a special walk and their favourite treat is perfect.', 'labrador':'Labs love food-based celebrations — a peanut butter cake will make their day.', 'shih tzu':'Shih Tzus love attention — a pamper session is the perfect birthday gift.', default:`${name}'s birthday is one of the most important days. Mira will remind you 7 days before.` },
    shop: { 'indie':'Indie dogs come in all sizes — always check measurements before ordering.', 'labrador':'Labs are large, energetic, and love to chew — choose durable products.', default:`Mira only shows products that fit ${name}'s breed, size, and health profile.` },
    paperwork: { default:`Keep ${name}'s documents in one place. Mira helps you stay organised and never miss a renewal.` },
    emergency: { 'shih tzu':'Shih Tzus are brachycephalic — watch for breathing difficulties in heat or stress.', 'labrador':'Labs can suffer bloat — avoid exercise immediately after meals.', 'indie':'Indie dogs are hardy but watch for tick-borne diseases and street injuries.', default:`Know your nearest 24-hour vet. Mira has it ready when you need it most.` },
    adopt: { 'indie':'Rescued Indie dogs often need 3-4 weeks to decompress. Give them time and space.', 'labrador':'Rehomed Labs adapt quickly — structure and routine help them settle.', default:`Give ${name} time to adjust. Every rescue dog blooms at their own pace.` },
    farewell: { default:`There are no words. Mira is here — for ${name} and for you.` },
    services: { default:`Every service Mira recommends for ${name} is briefed on their health, allergies, and temperament.` },
  };
  const pillarTips = tips[pillar] || {};
  for (const key of Object.keys(pillarTips)) {
    if (key !== 'default' && b.includes(key)) return pillarTips[key];
  }
  return pillarTips.default || `Mira personalises everything for ${name}.`;
}

// ── Mira voice line ──
function getMiraVoice(pillar, soul, name) {
  const allergy = soul.food_allergies && !ALLERGY_CLEAN.test(String(Array.isArray(soul.food_allergies)?soul.food_allergies[0]:soul.food_allergies)) ? (Array.isArray(soul.food_allergies)?soul.food_allergies.join(', '):soul.food_allergies) : null;
  const pronoun = soul.gender==='female'?'her':soul.gender==='male'?'him':'them';
  const lines = {
    care: allergy ? `I will never suggest anything with ${allergy} for ${name}.` : `I know what keeps ${name} healthy. Every recommendation respects their health profile.`,
    dine: soul.favorite_treats ? `${name} loves ${Array.isArray(soul.favorite_treats)?soul.favorite_treats.join(', '):soul.favorite_treats}. I use this for every food recommendation.` : `Tell me what ${name} loves to eat — and what to avoid.`,
    go: soul.usual_travel ? `${name} travels by ${soul.usual_travel}. I find places that truly welcome ${pronoun}.` : `Tell me how ${name} travels — so I can find the perfect destinations.`,
    play: soul.energy_level ? `${name} has ${soul.energy_level} energy. I know exactly what kind of play they need.` : `Tell me about ${name}'s play style.`,
    learn: soul.training_level ? `${name} is at ${soul.training_level} level. I'll recommend trainers who match their style.` : `Tell me what ${name} knows — and what they're still learning.`,
    celebrate: soul.celebration_preferences ? `I'll remind you 7 days before ${name}'s celebrations with ideas they'll love.` : `Tell me when ${name}'s birthday is — so I never forget it.`,
    shop: allergy ? `Every product I show ${name} is allergen-checked. No ${allergy} — ever.` : `I only show ${name} products that fit their breed, size, and health.`,
    paperwork: `I'll help you keep ${name}'s documents organised so nothing is ever missed.`,
    emergency: allergy ? `${name} cannot have ${allergy}. In an emergency, every provider will know this first.` : `I keep ${name}'s health profile ready for any emergency.`,
    adopt: `${name} found their forever home with you. I'm here to make every day wonderful.`,
    farewell: `I'm here with you. Whatever ${name} needs — I'll help you find it.`,
    services: `Every service arranged for ${name} is briefed on their full profile.`,
  };
  return lines[pillar] || `I know ${name}. Let me show you what I've learned.`;
}

function getPetProfileTabForPillar(pillar) {
  if (pillar === 'emergency' || pillar === 'care' || pillar === 'paperwork') return 'health';
  if (pillar === 'farewell') return 'memories';
  return 'personality';
}

// ── Main component ──
export default function PillarSoulProfile({
  pet, token,
  pillar = 'care',
  pillarColor, pillarLabel, pillarEmoji,
  color, // backwards compat
}) {
  const navigate = useNavigate();
  const CFG = {
    go:{c:'#3498DB',l:'Travel',e:'\u2708\uFE0F'}, dine:{c:'#C9973A',l:'Food',e:'\uD83C\uDF7D\uFE0F'},
    care:{c:'#40916C',l:'Wellness',e:'\uD83C\uDF3F'}, play:{c:'#E76F51',l:'Play',e:'\uD83C\uDFBE'},
    learn:{c:'#7C3AED',l:'Learning',e:'\uD83C\uDF93'}, celebrate:{c:'#A855F7',l:'Celebration',e:'\uD83C\uDF82'},
    paperwork:{c:'#0D9488',l:'Documents',e:'\uD83D\uDCC4'}, emergency:{c:'#EF4444',l:'Safety',e:'\uD83D\uDEA8'},
    farewell:{c:'#8B5CF6',l:'Memory',e:'\uD83C\uDF37'}, adopt:{c:'#65A30D',l:'Adoption',e:'\uD83D\uDC3E'},
    shop:{c:'#F59E0B',l:'Shopping',e:'\uD83D\uDED2'}, services:{c:'#0EA5E9',l:'Services',e:'\uD83E\uDD1D'},
  };
  const cfg = CFG[pillar] || { c:'#0D9488', l:pillar, e:'\u2B50' };
  const pColor = pillarColor || color || cfg.c;
  const pLabel = pillarLabel || cfg.l;
  const pEmoji = pillarEmoji || cfg.e;

  // ── Concierge® — every interaction creates a ticket ──
  const { fire: concierge } = useConcierge({ pet, pillar });

  const [open, setOpen] = useState(false);
  const [liveScore, setLiveScore] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [totalPts, setTotalPts] = useState(0);

  const soul = pet?.doggy_soul_answers || {};
  const name = pet?.name || 'your dog';
  const breed = pet?.breed || soul.breed || '';
  const tiles = getMiraTiles(pillar, soul, name);
  const breedTip = getBreedTip(pillar, breed, name);
  const miraVoice = getMiraVoice(pillar, soul, name);
  const score = liveScore ?? (pet?.overall_score || 0);
  const totalUnanswered = questions.length > 0 ? questions.filter(q => !submitted[q.question_id]).length : 0;
  const isComplete = score >= 100;
  const barColor = isComplete ? '#16A34A' : pColor;
  const scoreColor = isComplete ? '#16A34A' : pColor;

  const loadQuestions = useCallback(() => {
    if (!pet?.id) return;
    setQLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    fetch(`${API}/api/pet-soul/profile/${pet.id}/quick-questions?limit=4&context=${pillar}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: ctrl.signal,
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        clearTimeout(timer);
        if (data) {
          setQuestions((data.questions || []).map(q => ({ ...q, pet_id: pet.id })));
          if (data.current_score !== undefined) setLiveScore(data.current_score);
        }
      })
      .catch(err => { if (err.name !== 'AbortError') console.error('[PillarProfile]', err); })
      .finally(() => { clearTimeout(timer); setQLoading(false); });
  }, [pet?.id, pillar, token]);

  useEffect(() => {
    if (open) {
      loadQuestions();
      // ACTION 1: Concierge® ticket — profile viewed
      concierge({ type: 'request', name: `${pLabel} Profile viewed`, silent: true, metadata: { action: 'profile_viewed', pillar, score: Math.round(score) } });
    }
    else { setQuestions([]); setAnswers({}); setSubmitted({}); setTotalPts(0); }
  }, [open, loadQuestions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset on pet switch
  useEffect(() => { setOpen(false); setLiveScore(null); }, [pet?.id]);

  const handleAnswer = (qId, val, type) => {
    setAnswers(prev => {
      if (type === 'multi_select') {
        const cur = prev[qId] || [];
        return { ...prev, [qId]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
      }
      return { ...prev, [qId]: val };
    });
  };

  const handleSubmit = async (q) => {
    const answer = answers[q.question_id];
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return;
    setSubmitting(p => ({ ...p, [q.question_id]: true }));
    try {
      const res = await fetch(`${API}/api/pet-soul/profile/${pet.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body: JSON.stringify({ question_id: q.question_id, answer }),
      });
      if (res.ok) {
        const data = await res.json();
        setTotalPts(p => p + (q.weight || 3));
        setSubmitted(p => ({ ...p, [q.question_id]: true }));
        if (data.scores?.overall !== undefined) {
          setLiveScore(prev => prev === null ? data.scores.overall : Math.max(prev, data.scores.overall));
        }
        // ACTION 2: Concierge® ticket — soul question answered
        concierge({
          type: 'request',
          name: `Soul answer: ${q.question_text || q.question_id}`,
          note: `Answered "${Array.isArray(answer) ? answer.join(', ') : answer}" (+${q.weight || 3} pts)`,
          silent: true,
          metadata: { action: 'soul_answer', question_id: q.question_id, answer, pillar, points: q.weight || 3 },
        });
      }
    } catch (err) { console.error('[PillarProfile submit]', err); }
    finally { setSubmitting(p => ({ ...p, [q.question_id]: false })); }
  };

  if (!pet) return null;

  return (
    <>
      {/* Trigger bar — Dine-matched: compact, consistent across all 12 pillars */}
      <div onClick={() => setOpen(true)} data-testid={`${pillar}-profile-bar`}
        style={{
          display:'flex', alignItems:'center', gap:16, cursor:'pointer',
          padding:'20px 22px', boxSizing:'border-box',
          borderRadius:16, background:'#fff',
          border:`2px solid ${isComplete ? '#16A34A' : pColor}`,
          width:'100%', marginBottom:16, transition:'all 0.2s ease',
          boxShadow:`0 2px 12px ${pColor}14`, overflow:'visible',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 6px 28px ${pColor}30`; e.currentTarget.style.transform='translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow=`0 2px 12px ${pColor}14`; e.currentTarget.style.transform='translateY(0)'; }}
      >
        {/* Pet photo — clean CSS border ring, no SVG */}
        <div style={{
          width:56, height:56, borderRadius:'50%',
          border:`3px solid ${isComplete ? '#16A34A' : pColor}`,
          overflow:'hidden', flexShrink:0, padding:2, background:'#fff',
        }}>
          {pet?.photo_url
            ? <img src={pet.photo_url} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>
            : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:`${pColor}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{'\uD83D\uDC3E'}</div>
          }
        </div>
        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:17, fontWeight:700, color:'#1a0a2e', marginBottom:4 }}>{name}'s {pLabel} Profile</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:4 }}>
            {pet?.breed && (
              <span style={{ fontSize:13, fontWeight:600, color:pColor, background:`${pColor}10`, border:`1px solid ${pColor}25`, borderRadius:20, padding:'3px 10px', lineHeight:'18px' }}>
                {pet.breed}{pet?.doggy_soul_answers?.coat_type ? ` · ${pet.doggy_soul_answers.coat_type} coat` : ''}
              </span>
            )}
          </div>
          <div style={{ fontSize:13, color:scoreColor, fontWeight:600 }}>
            {isComplete ? 'Mira knows everything' : (totalUnanswered > 0 ? `${totalUnanswered} questions waiting` : 'Mira knows everything')}
          </div>
        </div>
        {/* Score + chevron */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:18, fontWeight:800, color:scoreColor, lineHeight:1 }}>{isFinite(score) ? Math.round(score) : 0}%</div>
            <span style={{ fontSize:9, color:scoreColor, fontWeight:600, opacity:0.6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Soul</span>
          </div>
          <div style={{ color:`${pColor}60`, fontSize:18, lineHeight:1 }}>&#8250;</div>
        </div>
      </div>

      {/* Drawer overlay — rendered via portal to escape overflow-x-hidden App wrapper */}
      {open && ReactDOM.createPortal(
        <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:100000, display:'flex', alignItems:'center', justifyContent:'center', padding:16, backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }}>
          <div onClick={e => e.stopPropagation()} data-testid={`${pillar}-profile-drawer`}
            className="no-sb"
            style={{ width:'100%', maxWidth:'min(680px, 95vw)', maxHeight:'85vh', background:'#0F0A1E', borderRadius:20, border:`1px solid ${pColor}30`, overflowY:'auto' }}>

            {/* Header */}
            <div style={{ padding:'20px 20px 16px', background:`linear-gradient(135deg, #0F0A1E, ${pColor}15)`, borderBottom:`1px solid ${pColor}20`, position:'sticky', top:0, zIndex:2 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', border:`2px solid ${pColor}50`, overflow:'hidden', background:`${pColor}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                    {pet?.photo_url ? <img src={pet.photo_url} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : '\uD83D\uDC3E'}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:'#F5F0E8' }}>{name}'s {pLabel} Profile</div>
                    <div style={{ fontSize:11, color:'rgba(245,240,232,0.4)' }}>{breed || 'Mixed breed'}</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:20, fontWeight:700, color:scoreColor }}>{isFinite(score) ? Math.round(score) : 0}%</div>
                    <div style={{ fontSize:9, color:'rgba(245,240,232,0.3)', letterSpacing:'0.06em' }}>SOUL SCORE</div>
                  </div>
                  <button onClick={() => setOpen(false)} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(245,240,232,0.5)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    ✕
                  </button>
                </div>
              </div>
              <div style={{ height:4, borderRadius:999, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                <div style={{ height:'100%', borderRadius:999, background:barColor, width:`${Math.min(isFinite(score)?score:0,100)}%`, transition:'width 0.8s ease' }}/>
              </div>
              {totalPts > 0 && <div style={{ marginTop:8, fontSize:11, color:pColor, fontWeight:600 }}>+{totalPts} pts added this session</div>}
            </div>

            <div style={{ padding:'16px 20px 32px' }}>

              {/* Mira voice */}
              <div style={{ background:'rgba(155,89,182,0.08)', border:'1px solid rgba(155,89,182,0.2)', borderRadius:12, padding:'12px 14px', marginBottom:20, display:'flex', gap:10, alignItems:'flex-start' }}>
                <span style={{ fontSize:14, flexShrink:0 }}>✦</span>
                <div style={{ fontSize:13, fontStyle:'italic', color:'rgba(245,240,232,0.7)', lineHeight:1.6 }}>{miraVoice}</div>
              </div>

              {/* COMPLETE PETS — "Mira knows everything" banner */}
              {isComplete && (
                <div style={{
                  background:'rgba(22,163,74,0.08)',
                  border:'1px solid rgba(22,163,74,0.2)',
                  borderRadius:12, padding:'10px 14px', marginBottom:16,
                  display:'flex', alignItems:'center', gap:8
                }}>
                  <span style={{ fontSize:14 }}>✓</span>
                  <div style={{ fontSize:13, color:'rgba(245,240,232,0.7)', fontStyle:'italic' }}>
                    Mira knows {name} completely. Every recommendation is fully personalised.
                  </div>
                </div>
              )}

              {/* INCOMPLETE PETS — Questions FIRST */}
              {!isComplete && !qLoading && questions.filter(q => !submitted[q.question_id]).length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:pColor, letterSpacing:'0.1em', marginBottom:10 }}>
                    HELP MIRA KNOW {name.toUpperCase()} · {questions.filter(q => !submitted[q.question_id]).length} QUESTIONS WAITING
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {questions.filter(q => !submitted[q.question_id]).map(q => {
                      const ans = answers[q.question_id];
                      const hasAns = ans && (Array.isArray(ans) ? ans.length > 0 : ans !== '');
                      return (
                        <div key={q.question_id} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 16px' }}>
                          <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(201,151,58,0.12)', border:'1px solid rgba(201,151,58,0.25)', borderRadius:999, padding:'2px 10px', fontSize:10, fontWeight:600, color:'#C9973A', marginBottom:10 }}>
                            +{q.weight || 3} pts
                          </div>
                          <div style={{ fontSize:13, fontWeight:600, color:'rgba(245,240,232,0.85)', marginBottom:10, lineHeight:1.4 }}>
                            {(q.question_text || q.question || '').replace(/\{name\}/g, name)}
                          </div>
                          {q.options ? (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: hasAns ? 10 : 0 }}>
                              {q.options.map(opt => {
                                const sel = q.type === 'multi_select' ? (ans || []).includes(opt) : ans === opt;
                                return (
                                  <button key={opt} onClick={() => handleAnswer(q.question_id, opt, q.type)}
                                    style={{ padding:'6px 14px', borderRadius:999, fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.15s', border:`1.5px solid ${sel ? pColor : 'rgba(255,255,255,0.1)'}`, background: sel ? `${pColor}20` : 'rgba(255,255,255,0.03)', color: sel ? pColor : 'rgba(245,240,232,0.55)' }}>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <textarea
                              value={ans || ''}
                              onChange={e => handleAnswer(q.question_id, e.target.value, 'text')}
                              placeholder={`Type your answer about ${name}…`}
                              rows={2}
                              style={{
                                width: '100%', boxSizing: 'border-box',
                                background: 'rgba(255,255,255,0.05)',
                                border: `1.5px solid ${ans ? pColor : 'rgba(255,255,255,0.12)'}`,
                                borderRadius: 10, padding: '10px 12px',
                                fontSize: 12, color: 'rgba(245,240,232,0.85)',
                                resize: 'vertical', outline: 'none', lineHeight: 1.5,
                                marginBottom: ans ? 10 : 0,
                                fontFamily: 'inherit',
                                transition: 'border-color 0.15s'
                              }}
                            />
                          )}
                          {hasAns && (
                            <button onClick={() => handleSubmit(q)} disabled={submitting[q.question_id]}
                              style={{ padding:'8px 18px', borderRadius:20, border:'none', background: submitting[q.question_id] ? `${pColor}40` : pColor, color:'#fff', fontSize:12, fontWeight:700, cursor: submitting[q.question_id] ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:6 }}>
                              {submitting[q.question_id] ? 'Saving...' : 'Save +' + (q.weight || 3) + ' pts'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {Object.keys(submitted).length > 0 && (
                      <div style={{ background:`${pColor}10`, border:`1px solid ${pColor}25`, borderRadius:12, padding:'12px 14px', fontSize:13, color:pColor, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
                        <span>✓</span> {Object.keys(submitted).length} answer{Object.keys(submitted).length > 1 ? 's' : ''} saved to {name}'s soul profile
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!isComplete && qLoading && (
                <div style={{ textAlign:'center', padding:16, color:'rgba(245,240,232,0.3)', fontSize:13, marginBottom:20 }}>Loading questions for {name}...</div>
              )}

              {/* SECTION 1: What Mira knows */}
              {tiles.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:pColor, letterSpacing:'0.1em', marginBottom:10 }}>
                    WHAT MIRA KNOWS ABOUT {name.toUpperCase()}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
                    {tiles.map((t, i) => (
                      <div key={i} style={{ background: t.urgent ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.04)', border:`1px solid ${t.urgent ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:'10px 12px' }}>
                        <div style={{ fontSize:10, fontWeight:600, color: t.urgent ? '#F87171' : pColor, marginBottom:3, letterSpacing:'0.05em' }}>{t.icon} {t.label}</div>
                        <div style={{ fontSize:13, color: t.urgent ? '#FCA5A5' : 'rgba(245,240,232,0.75)', lineHeight:1.4, fontWeight: t.urgent ? 600 : 400 }}>{t.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 2: Breed tip */}
              <div style={{ background:`${pColor}08`, border:`1px solid ${pColor}20`, borderRadius:12, padding:'12px 14px', marginBottom:20 }}>
                <div style={{ fontSize:10, fontWeight:700, color:pColor, letterSpacing:'0.1em', marginBottom:6 }}>
                  MIRA ON {(breed || 'YOUR BREED').toUpperCase()} · {pLabel.toUpperCase()}
                </div>
                <div style={{ fontSize:13, color:'rgba(245,240,232,0.65)', lineHeight:1.6, fontStyle:'italic' }}>{breedTip}</div>
              </div>

              {/* SECTION 3: Mira Imagines cards */}
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:10, fontWeight:700, color:pColor, letterSpacing:'0.08em', marginBottom:10 }}>
                  MIRA IMAGINES FOR {name.toUpperCase()}
                </div>
                <MiraImaginesBreed pet={pet} pillar={pillar} colour={pColor} onConcierge={(product) => {
                  concierge({
                    type: 'product',
                    name: product?.name || product?.title || 'Mira Imagines product',
                    item: product,
                    silent: false,
                    metadata: { action: 'mira_imagines_click', pillar, product_name: product?.name || product?.title },
                  });
                }} />
              </div>

              {/* Empty state for pets with no tiles and no questions */}
              {!isComplete && !qLoading && questions.filter(q => !submitted[q.question_id]).length === 0 && tiles.length === 0 && (
                <div style={{ textAlign:'center', padding:'20px 0', color:'rgba(245,240,232,0.3)', fontSize:13 }}>
                  Tell Mira about {name}'s {pLabel.toLowerCase()} — every answer personalises their experience.
                </div>
              )}

              {/* Footer */}
              <button onClick={() => {
                setOpen(false);
                navigate(`/pet/${pet.id}?tab=${getPetProfileTabForPillar(pillar)}`);
              }}
                data-testid={`${pillar}-profile-full-link`}
                style={{ marginTop:20, width:'100%', padding:11, borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)', color:'rgba(245,240,232,0.4)', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all 0.15s' }}>
                {score >= 100 ? `See ${name}'s full profile` : `Continue ${name}'s profile`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
