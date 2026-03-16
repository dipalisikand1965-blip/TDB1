/**
 * DineSoulPage.jsx — /dine pillar
 * The Doggy Company · Built from DineSoulPage_v2 spec
 *
 * Architecture: PillarPageLayout wrapper (matches /celebrate-soul)
 * Data spine:   TummyProfile → pet allergies/loves/health filter everything
 * Colors:       Amber / terracotta  (#3d1200 → #e86a00)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import DineCategoryStrip from "../components/dine/DineCategoryStrip";
import DineHero from "../components/dine/DineHero";
import MealBoxCard from "../components/dine/MealBoxCard";
import ConciergeIntakeModal from "../components/dine/ConciergeIntakeModal";
import DineConciergeSection from "../components/dine/DineConciergeSection";
import GuidedNutritionPaths from "../components/dine/GuidedNutritionPaths";
import MiraOrb from "../components/MiraOrb";
import { PillarHelpBuckets, PillarGuidedPaths } from "../components/PillarGoldSections";
import { API_URL } from "../utils/api";
import SharedProductCard from "../components/ProductCard";

// ─── Dimension visual config — dynamic per pet ───────────────────────────────
function getDineDims(pet) {
  const loves = getLoves(pet);
  const allergies = getAllergies(pet);
  // Extract clean protein name - strip food/treat suffix words to avoid "Salmon treats-forward"
  const rawFav = loves[0] || null;
  const favProtein = rawFav
    ? rawFav.replace(/\s*(treats?|biscuits?|food|meal|diet|snacks?|chews?)\s*$/i, '').trim()
    : null;
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
  const allergyFreeText = allergies.length > 0
    ? allergies.slice(0, 2).map(a => `${a.toLowerCase()}-free`).join(', ')
    : 'allergy-checked';

  return [
    {
      id:"meals", icon:"🐟", name:"Daily Meals",
      sub: favProtein
        ? `${cap(favProtein)}-forward, ${allergyFreeText}, right for {name}`
        : `Nutritionally balanced, ${allergyFreeText}, right for {name}`,
      badge:"{name}'s body needs this", badgeBg:"rgba(255,140,66,0.18)", badgeCol:"#8B4500",
      bg:"linear-gradient(135deg,#FFF3E0,#FFE0B2)", dot:"#FF8C42", glow:true,
      mira: favProtein
        ? `I built this around {name}'s weight, age, and health profile. The ${favProtein.toLowerCase()} meals are first. Everything here is ${allergyFreeText} and treatment-safe.`
        : `I built this around {name}'s weight, age, and health profile. Everything here is ${allergyFreeText} and treatment-safe.`,
    },
    {
      id:"treats", icon:"🦴", name:"Treats & Rewards",
      sub: favProtein
        ? `${cap(favProtein)} treats first — {name} loves these`
        : `Healthy treats {name} will love`,
      badge:"{name} loves these", badgeBg:"rgba(233,30,99,0.18)", badgeCol:"#880E4F",
      bg:"linear-gradient(135deg,#FCE4EC,#F8BBD0)", dot:"#E91E63", glow:true,
      mira: favProtein
        ? `Everything here is ${allergyFreeText}. The ${favProtein.toLowerCase()} treats are first because {name} loves them.`
        : `All treats are ${allergyFreeText} and dog-safe. Pick the ones {name} will love most.`,
    },
    {
      id:"supplements", icon:"💊", name:"Supplements",
      sub:"Treatment-safe, vet-checked",
      badge:"Health priority", badgeBg:"rgba(76,175,80,0.18)", badgeCol:"#2E7D32",
      bg:"linear-gradient(135deg,#E8F5E9,#C8E6C9)", dot:"#4CAF50", glow:true,
      mira:`These are the supplements I would choose for {name} right now — every one is treatment-safe, vet-checked, and ${allergyFreeText}.`,
    },
    {
      id:"frozen", icon:"🧊", name:"Frozen & Fresh",
      sub:"Cold-pressed options for {name}",
      badge:"Explore", badgeBg:"rgba(0,0,0,0.08)", badgeCol:"#555555",
      bg:"linear-gradient(135deg,#E3F2FD,#BBDEFB)", dot:"#2196F3", glow:false,
      mira:`Tell me if {name} prefers cold-pressed or raw food and I'll build this section around that preference.`,
    },
    {
      id:"homemade", icon:"🍳", name:"Homemade & Recipes",
      sub: allergies.length > 0
        ? `Recipes avoiding ${allergies.slice(0,2).join(', ')} for {name}`
        : `Recipes built around {name}'s taste`,
      badge:"Explore", badgeBg:"rgba(0,0,0,0.08)", badgeCol:"#555555",
      bg:"linear-gradient(135deg,#FFFDE7,#FFF9C4)", dot:"#F9A825", glow:false,
      mira: allergies.length > 0
        ? `These recipes avoid ${allergies.slice(0,2).join(', ')} — everything here is safe and nutritious for {name}.`
        : `These recipes are built around what {name} loves. Everything is nutritious and dog-safe.`,
    },
  ];
}

// ─── Category → dim mapping (used for dynamic product lookup) ────────────────
const DIM_ID_TO_CATEGORY = {
  meals:       "Daily Meals",
  treats:      "Treats & Rewards",
  supplements: "Supplements",
  frozen:      "Frozen & Fresh",
  homemade:    "Homemade & Recipes",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function t(str, name) { return str.replace(/{name}/g, name || "your dog"); }

const CLEAN_NONE = /^(no|none|none_confirmed|no_allergies|no allergies)$/i;

function getAllergies(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => { if (x && !CLEAN_NONE.test(String(x).trim())) s.add(x); });
    else if (v && !CLEAN_NONE.test(String(v).trim())) s.add(v);
  };
  add(pet?.preferences?.allergies); add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.doggy_soul_answers?.allergies); add(pet?.allergies);
  return [...s].filter(a => a && !CLEAN_NONE.test(String(a).trim()));
}

function getLoves(pet) {
  const loves = [];
  const addLove = item => {
    if (!item) return;
    const v = typeof item === "string" ? item : (item?.name || item?.value || null);
    if (v) loves.push(v);
  };
  addLove(pet?.doggy_soul_answers?.favorite_treats);
  addLove(pet?.doggy_soul_answers?.favorite_protein);
  if (pet?.preferences?.favorite_flavors?.length) addLove(pet.preferences.favorite_flavors[0]);
  return [...new Set(loves)].slice(0, 3);
}

function getHealthCondition(pet) {
  const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
  if (!raw) return null;
  const str = Array.isArray(raw) ? raw.join(", ") : String(raw);
  return str.toLowerCase() === "none" || str.trim() === "" ? null : str;
}

// ─── Shared micro-components ─────────────────────────────────────────────────
function MiraQuoteBox({ text, byline }) {
  return (
    <div style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"flex-start",gap:8,maxWidth:480}}>
      <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#FF8C42,#C44DFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",flexShrink:0,marginTop:1}}>✦</div>
      <div>
        <p style={{fontSize:12,color:"#fff",lineHeight:1.55,fontStyle:"italic",margin:0}}>{text}</p>
        <span style={{fontSize:10,color:"#FFAAD4",display:"block",marginTop:2,fontWeight:600}}>{byline || "♥ Mira knows Mojo"}</span>
      </div>
    </div>
  );
}

function SoulChip({ children, extraStyle = {} }) {
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:4,borderRadius:20,padding:"4px 10px",fontSize:11,color:"#fff",border:"1px solid rgba(255,255,255,0.18)",background:"rgba(255,255,255,0.10)",...extraStyle}}>
      {children}
    </div>
  );
}

// ─── Shared allergen helpers (used by applyMiraIntelligence) ─────────────────
function isSafeFromAllergen(allergen, text, freeFromText) {
  const a = allergen.toLowerCase();
  if (freeFromText.includes(`${a}-free`) || freeFromText.includes(`${a} free`)) return true;
  if (text.includes(`${a}-free`) || text.includes(`${a} free`)) return true;
  return false;
}
function containsAllergen(allergen, text) {
  const a = allergen.toLowerCase();
  const cleaned = text.replace(new RegExp(`${a}[- ]free`, 'gi'), '');
  return cleaned.includes(a);
}

// ─── Mira Intelligence: filter, sort, dim, and reason products for pet ────────
function applyMiraIntelligence(products, allergies, loves, healthCondition, nutritionGoal, pet) {
  const petName = pet?.name || 'your dog';
  const allergyTerms = allergies.map(a => a.toLowerCase().trim());
  const loveTerms = loves.map(l => l.toLowerCase().trim()).filter(Boolean);

  return products
    // 1. Remove products containing known allergens
    .filter(p => {
      if (!allergyTerms.length) return true;
      const productText = `${p.name} ${p.description || ''}`.toLowerCase();
      const freeFromText = (p.allergy_free || '').toLowerCase();
      return !allergyTerms.some(allergen => {
        if (isSafeFromAllergen(allergen, productText, freeFromText)) return false;
        return containsAllergen(allergen, productText);
      });
    })
    // 2. Enrich with Mira flags + "Why Mira picked this"
    .map(p => {
      const productText = `${p.name} ${p.description || ''} ${p.sub_category || ''}`.toLowerCase();
      const freeFromText = (p.allergy_free || '').toLowerCase();
      const tagText = (p.mira_tag || '').toLowerCase();

      const matchedLove = loveTerms.find(l => productText.includes(l));
      const isHealthSafe = healthCondition && (
        tagText.includes('treatment') ||
        freeFromText.includes('treatment-safe') ||
        productText.includes('treatment-safe') ||
        productText.includes('recovery')
      );
      const isAllergySafe = allergyTerms.length > 0 &&
        allergyTerms.every(a => freeFromText.includes(`${a}-free`));
      const conflictsGoal = nutritionGoal && (
        (nutritionGoal.toLowerCase().includes('weight loss') && productText.includes('high calorie')) ||
        (nutritionGoal.toLowerCase().includes('weight gain') && productText.includes('low calorie'))
      );

      // "Why Mira picked this" — prefer existing DB hint
      let mira_hint = p.mira_hint || null;
      if (!mira_hint) {
        if (matchedLove) mira_hint = `Matches ${petName}'s love for ${matchedLove}`;
        else if (isHealthSafe) mira_hint = `Safe during ${petName}'s treatment`;
        else if (isAllergySafe) mira_hint = `Free from ${allergyTerms.join(' & ')} — safe for ${petName}`;
        else if (p.mira_tag) mira_hint = p.mira_tag;
      }

      return { ...p, mira_hint, _loved: !!matchedLove, _healthSafe: isHealthSafe, _dimmed: !!conflictsGoal };
    })
    // 3. Sort: loved → health-safe → rest
    .sort((a, b) => {
      if (a._loved && !b._loved) return -1;
      if (!a._loved && b._loved) return 1;
      if (a._healthSafe && !b._healthSafe) return -1;
      if (!a._healthSafe && b._healthSafe) return 1;
      return 0;
    });
}

// ─── Soul Question Card (Dine — amber themed) ────────────────────────────────
function SoulQuestionCardDine({ question, petName, onAnswered, token }) {
  const [selected, setSelected] = useState('');
  const [textValue, setTextValue] = useState('');
  const [multiSelected, setMultiSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pointsGained, setPointsGained] = useState(null);

  const handleSubmit = async () => {
    const answer = question.type === 'text' ? textValue
      : question.type === 'multi_select' ? multiSelected
      : selected;
    if (!answer || (Array.isArray(answer) && answer.length === 0)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/pet-soul/profile/${question.pet_id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ question_id: question.question_id, answer })
      });
      if (res.ok) {
        const data = await res.json();
        setPointsGained(question.weight || 3);
        setSubmitted(true);
        onAnswered?.(data.scores?.overall, question.weight || 3);
      }
    } catch (err) {
      console.error('[SoulQuestionCardDine] Error:', err);
      setPointsGained(question.weight || 3);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMulti = (opt) => {
    setMultiSelected(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };

  if (submitted) {
    return (
      <div style={{
        borderRadius: 16, padding: '16px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 140,
        background: 'linear-gradient(135deg, #1A0A00 0%, #0A2000 100%)',
        border: '2px solid rgba(80,220,120,0.45)',
        boxShadow: '0 0 24px rgba(80,220,120,0.15)',
      }}>
        <div style={{
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 40, height: 40, marginBottom: 4,
          background: 'rgba(80,220,120,0.18)', border: '2px solid rgba(80,220,120,0.5)',
        }}>
          <Check size={20} style={{ color: '#50DC78' }} />
        </div>
        <p style={{ fontWeight: 800, color: '#50DC78', fontSize: 14, textAlign: 'center' }}>Soul score growing!</p>
        {pointsGained && (
          <div style={{ borderRadius: 20, padding: '4px 12px', fontWeight: 700, fontSize: 11, background: 'rgba(80,220,120,0.15)', color: '#50DC78', border: '1px solid rgba(80,220,120,0.3)' }}>
            +{pointsGained} pts added
          </div>
        )}
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, textAlign: 'center' }}>
          Mira now knows {petName} better ✦
        </p>
      </div>
    );
  }

  const hasAnswer = selected || textValue.trim() || multiSelected.length > 0;

  return (
    <div style={{
      borderRadius: 16, padding: '14px',
      background: 'linear-gradient(135deg, #1A0620 0%, #2d0a00 100%)',
      border: '1.5px solid rgba(180,80,255,0.22)',
      minHeight: 140,
      boxShadow: '0 4px 20px rgba(100,20,60,0.18)',
    }}>
      {/* Folder label + weight */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12 }}>{question.folder_icon || '✦'}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,200,120,0.85)' }}>
            {question.folder_name}
          </span>
        </div>
        <span style={{
          borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700,
          background: 'rgba(255,140,66,0.20)', color: '#FFB366',
          border: '1px solid rgba(255,140,66,0.35)',
        }}>
          +{question.weight || 3} pts
        </span>
      </div>

      {/* Question */}
      <p style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.92)', marginBottom: 10, lineHeight: 1.4 }}>
        {question.question}
      </p>

      {question.type === 'text' && (
        <textarea
          value={textValue}
          onChange={e => setTextValue(e.target.value)}
          placeholder="Type here..."
          rows={2}
          style={{
            width: '100%', borderRadius: 10, padding: '8px 12px', fontSize: 12,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,140,66,0.40)',
            color: 'rgba(255,255,255,0.88)', outline: 'none', resize: 'none', boxSizing: 'border-box',
          }}
        />
      )}

      {question.type === 'select' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {(question.options || []).map(opt => (
            <button key={opt} onClick={() => setSelected(opt)} style={{
              borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600,
              background: selected === opt ? 'rgba(255,140,66,0.25)' : 'rgba(255,255,255,0.07)',
              border: selected === opt ? '1.5px solid #FF8C42' : '1px solid rgba(255,255,255,0.15)',
              color: selected === opt ? '#FFD080' : 'rgba(255,255,255,0.72)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{opt}</button>
          ))}
        </div>
      )}

      {question.type === 'multi_select' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {(question.options || []).slice(0, 6).map(opt => (
            <button key={opt} onClick={() => toggleMulti(opt)} style={{
              borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 600,
              background: multiSelected.includes(opt) ? 'rgba(255,140,66,0.25)' : 'rgba(255,255,255,0.07)',
              border: multiSelected.includes(opt) ? '1.5px solid #FF8C42' : '1px solid rgba(255,255,255,0.15)',
              color: multiSelected.includes(opt) ? '#FFD080' : 'rgba(255,255,255,0.72)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{opt}</button>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !hasAnswer}
        style={{
          marginTop: 8, width: '100%', borderRadius: 10, padding: '8px', fontSize: 12,
          fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: !hasAnswer ? 'rgba(255,140,66,0.20)' : 'linear-gradient(135deg, #FF8C42, #C44400)',
          border: 'none', cursor: submitting ? 'wait' : (!hasAnswer ? 'not-allowed' : 'pointer'),
          boxShadow: hasAnswer ? '0 4px 16px rgba(196,68,0,0.40)' : 'none',
          opacity: submitting ? 0.7 : 1, transition: 'all 0.2s',
        }}
        data-testid={`soul-question-submit-${question.question_id}`}
      >
        {submitting ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} />}
        Save +{question.weight || 3} pts
      </button>
    </div>
  );
}

function getFoodEmoji(food) {
  const f = (food || '').toLowerCase();
  if (f.includes('salmon') || f.includes('fish')) return '🐟';
  if (f.includes('chicken')) return '🍗';
  if (f.includes('beef') || f.includes('lamb')) return '🥩';
  if (f.includes('peanut') || f.includes('nut')) return '🥜';
  if (f.includes('pumpkin') || f.includes('sweet')) return '🎃';
  if (f.includes('carrot') || f.includes('veg')) return '🥕';
  if (f.includes('egg')) return '🥚';
  return '🍽️';
}

// ─── Generate Mira's food imagines (mirrors CelebrateContentModal pattern) ────
function generateFoodImagines(pet, loves, allergies, healthCondition) {
  const petName = pet?.name || 'your dog';
  const imagines = [];
  const seen = new Set();
  const allergySet = new Set(allergies.map(a => a.toLowerCase()));
  const soulAnswers = pet?.doggy_soul_answers || {};
  const favProtein = soulAnswers.favorite_protein || soulAnswers.fav_protein;
  const breed = (pet?.breed || soulAnswers.breed || '').split('(')[0].trim();

  // soul-answered fav protein first, then loves list
  const allSources = [...loves];
  if (favProtein && !allSources.map(f => f.toLowerCase()).includes(favProtein.toLowerCase())) {
    allSources.unshift(favProtein);
  }

  for (const food of allSources.slice(0, 2)) {
    const key = food.toLowerCase().replace(/\s*(treat|food|cake)s?\b/g, '').trim();
    if (!key || key.length < 2 || seen.has(key) || allergySet.has(key)) continue;
    seen.add(key);
    const label = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const breedSuffix = breed ? ` — soy-free, ${breed.toLowerCase() === 'labrador' || breed.toLowerCase().includes('retriever') ? 'weight-conscious' : 'omega-rich'}` : ' — omega-rich';
    imagines.push({
      emoji: getFoodEmoji(key),
      bg: 'linear-gradient(135deg, #1A0A00, #2d0a18)',
      name: `${label} Weekly Meal Box`,
      desc: `Built around what ${petName} loves${breedSuffix}`,
      reason: `Because ${petName} loves ${food}`,
    });
    if (imagines.length < 4) {
      imagines.push({
        emoji: key.includes('peanut') || key.includes('nut') ? '🥜' : '🎁',
        bg: 'linear-gradient(135deg, #0d1a00, #1a1a30)',
        name: `${label} Training Pack`,
        desc: `High-value rewards${breed ? `, tailored for a ${breed}'s training drive` : ''} — no xylitol`,
        reason: `Because ${petName} loves ${food}`,
      });
    }
  }

  // Breed-specific card
  if (breed && imagines.length < 4) {
    const breedLower = breed.toLowerCase();
    const breedCard = breedLower.includes('labrador') || breedLower.includes('retriever')
      ? { emoji: '🦴', name: 'Joint Support Blend', desc: `Glucosamine & omega-3 formula — especially important for ${breed}s`, reason: `Mira knows ${breed}s need joint care` }
      : breedLower.includes('german') || breedLower.includes('shepherd') || breedLower.includes('husky')
      ? { emoji: '💪', name: 'High-Performance Kibble', desc: `Protein-dense formula for ${breed}'s active metabolism`, reason: `Because ${breed}s burn more energy` }
      : breedLower.includes('indie') || breedLower.includes('pariah') || breedLower.includes('mongrel') || breedLower.includes('mix')
      ? { emoji: '🌿', name: 'Balanced Wholesome Bowl', desc: `Adaptogen-rich, easily digestible — formulated for India's native breeds`, reason: `Mira knows Indian dogs thrive on diverse nutrition` }
      : { emoji: '🏆', name: `${breed} Formulated Blend`, desc: `Nutritionally calibrated for ${petName}'s ${breed} — size, metabolism, and temperament`, reason: `Mira knows every ${breed} is different` };
    imagines.push({ bg: 'linear-gradient(135deg, #0a1a00, #0d2800)', ...breedCard });
  }

  if (healthCondition && imagines.length < 4) {
    imagines.push({
      emoji: '🛡️',
      bg: 'linear-gradient(135deg, #001a0d, #003a20)',
      name: 'Recovery Support Bowl',
      desc: `Formulated keeping ${petName}'s ${healthCondition} in mind — gentle, nourishing, restorative`,
      reason: `Because of ${petName}'s ${healthCondition}`,
    });
  }

  if (allergies.length > 0 && imagines.length < 4) {
    const a = allergies[0];
    const aLabel = a.charAt(0).toUpperCase() + a.slice(1);
    imagines.push({
      emoji: '✓',
      bg: 'linear-gradient(135deg, #001a0a, #003a20)',
      name: `${aLabel}-Free Complete Meal`,
      desc: `100% ${aLabel.toLowerCase()}-free nutrition ${petName} can eat worry-free`,
      reason: `Because ${petName} is allergic to ${aLabel.toLowerCase()}`,
    });
  }

  if (imagines.length === 0) {
    imagines.push({
      emoji: '✨',
      bg: 'linear-gradient(135deg, #1A0A00, #3d1200)',
      name: `Help Mira know ${petName} better`,
      desc: 'Answer a few questions so Mira can imagine perfect meals',
      reason: 'Soul profile in progress',
    });
  }

  return imagines.slice(0, 4);
}

// ─── Mira Tummy Imagines Card (with concierge ticket — mirrors CelebrateContentModal) ─
function MiraTummyImaginesCard({ card, pet, token }) {
  const [sending, setSending] = useState(false);
  const [requested, setRequested] = useState(false);

  const handleRequest = async () => {
    setSending(true);
    const userRaw = localStorage.getItem('user') || '{}';
    let user = {};
    try { user = JSON.parse(userRaw); } catch {}
    const petName = pet?.name || 'my dog';
    try {
      await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          parent_id: user?.id || user?.email || 'dine_guest',
          pet_id: pet?.id || 'unknown',
          pillar: 'dine',
          intent_primary: 'mira_imagines_product',
          intent_secondary: [card.name, 'custom_dine_product'],
          life_state: 'dine',
          channel: 'dine_mira_imagines',
          initial_message: {
            sender: 'parent',
            source: 'dine_page',
            text: `Hi! I'd love to get "${card.name}" for ${petName}. ${card.reason}. Can you source this?`
          }
        })
      });
    } catch (err) {
      console.error('[MiraTummyImaginesCard] Concierge ticket error:', err);
    } finally {
      setSending(false);
      setRequested(true);
    }
  };

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden', position: 'relative',
      background: card.bg || 'linear-gradient(135deg, #1A0A00, #3d1200)',
      border: '1px solid rgba(255,140,66,0.20)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* "Mira Imagines" badge — pink to orange gradient */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 2,
        borderRadius: 20, padding: '4px 12px', fontSize: 10, fontWeight: 700,
        background: 'linear-gradient(135deg, #FF2D87, #FF8C42)',
        color: '#fff', boxShadow: '0 2px 8px rgba(255,45,135,0.35)',
      }}>
        Mira Imagines
      </div>
      {/* Emoji — centered, large */}
      <div style={{
        height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 44, paddingTop: 28,
      }}>
        {card.emoji}
      </div>
      {/* Content — centered */}
      <div style={{ padding: '12px 16px 16px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 6, lineHeight: 1.3 }}>{card.name}</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)', marginBottom: 6, lineHeight: 1.5, flex: 1 }}>{card.desc}</p>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#FF8C42', fontStyle: 'italic', marginBottom: 12 }}>{card.reason}</p>
        {requested ? (
          <div style={{
            borderRadius: 10, padding: '8px', fontSize: 11, fontWeight: 700,
            background: 'rgba(50,200,120,0.20)', border: '1px solid rgba(50,200,120,0.40)',
            color: '#32C878', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Check size={13} /> Sent to Concierge!
          </div>
        ) : (
          <button
            onClick={handleRequest}
            disabled={sending}
            style={{
              width: '100%', borderRadius: 10, padding: '8px', fontSize: 11, fontWeight: 700,
              background: sending ? 'rgba(255,45,135,0.40)' : 'linear-gradient(135deg, #FF2D87, #FF8C42)',
              border: 'none', color: '#fff', cursor: sending ? 'wait' : 'pointer',
              boxShadow: sending ? 'none' : '0 3px 12px rgba(255,45,135,0.30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              opacity: sending ? 0.7 : 1,
            }}
            data-testid={`mira-request-${card.name?.replace(/\s+/g, '-').toLowerCase()}`}
          >
            {sending && <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />}
            Request a Quote →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Dine Soul Questions Section (inside modal — score header is in modal header) ─
function DineSoulQuestionsSection({ pet, token, onScoreUpdated }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPts, setTotalPts] = useState(0);
  const petName = pet?.name || 'your pet';

  const loadQuestions = useCallback(() => {
    if (!pet?.id) { setLoading(false); return; }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000); // 8s timeout
    fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/quick-questions?limit=4&context=dine`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        clearTimeout(timer);
        if (data) {
          setQuestions((data.questions || []).map(q => ({ ...q, pet_id: pet.id })));
          if (data.current_score !== undefined) onScoreUpdated?.(data.current_score);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error('[TummyProfile questions]', err);
      })
      .finally(() => { clearTimeout(timer); setLoading(false); });
  }, [pet?.id]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const handleAnswered = useCallback((newScore, pts) => {
    setAnsweredCount(prev => prev + 1);
    setTotalPts(prev => prev + (pts || 0));
    if (newScore !== undefined) {
      onScoreUpdated?.(newScore);
      window.dispatchEvent(new CustomEvent('soulScoreUpdated', { detail: { petId: pet.id, score: newScore } }));
    }
    setTimeout(() => loadQuestions(), 800);
  }, [pet?.id, loadQuestions, onScoreUpdated]);

  const visibleQuestions = questions.slice(0, Math.max(0, 4 - answeredCount));

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: '#888', fontSize: 13 }}>
      <div style={{ width: 20, height: 20, border: '2px solid #FFE5CC', borderTopColor: '#FF8C42', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
      Loading {petName}'s questions…
    </div>
  );
  if (visibleQuestions.length === 0 && answeredCount === 0) return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>🎉</div>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#1A0A00', marginBottom: 6 }}>
        {petName}'s food profile is complete!
      </p>
      <p style={{ fontSize: 12, color: '#888' }}>
        All questions answered · Mira has everything she needs
      </p>
    </div>
  );

  return (
    <div style={{ marginBottom: 24 }}>
      {answeredCount > 0 && (
        <div style={{
          marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(80,220,120,0.08)', border: '1px solid rgba(80,220,120,0.25)',
        }}>
          <Check size={14} style={{ color: '#50DC78', flexShrink: 0 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#50DC78' }}>
            {answeredCount} answer{answeredCount > 1 ? 's' : ''} saved · +{totalPts} pts
          </p>
        </div>
      )}

      {visibleQuestions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {visibleQuestions.map(q => (
            <SoulQuestionCardDine key={q.question_id} question={q} petName={petName} token={token} onAnswered={handleAnswered} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <a href={`/pet-soul/${pet?.id}`} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(196,68,0,0.75)', textDecoration: 'none' }}>
          See full soul profile →
        </a>
      </div>
    </div>
  );
}

// ─── TummyProfile — compact bar + centered modal (exactly like Mira's Picks) ─
function TummyProfile({ pet, token }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [liveScore, setLiveScore] = useState(null);
  const allergies = getAllergies(pet);
  const loves = getLoves(pet);
  const healthCondition = getHealthCondition(pet);
  const petName = pet?.name || 'your dog';
  const miraFoodCards = generateFoodImagines(pet, loves, allergies, healthCondition);

  return (
    <>
      {/* ── Compact clickable bar ── */}
      <div
        onClick={() => setDrawerOpen(true)}
        data-testid="tummy-profile"
        style={{
          background: '#fff', border: '2px solid #FFE5CC', borderRadius: 16,
          padding: '14px 18px', marginBottom: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 2px 12px rgba(196,68,0,0.08)',
          transition: 'box-shadow 0.18s',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0, fontSize: 20,
          background: 'linear-gradient(135deg,#FFF3E0,#FFE0B2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>🐾</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A0A00' }}>{petName}'s Tummy Profile</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
            {allergies.map(a => (
              <span key={a} style={{ fontSize: 10, fontWeight: 600, color: '#C0392B', background: '#FEF0F0', border: '1px solid #F5C6C6', borderRadius: 20, padding: '2px 8px' }}>✗ {a}</span>
            ))}
            {loves.slice(0, 2).map(l => (
              <span key={l} style={{ fontSize: 10, fontWeight: 600, color: '#27AE60', background: '#E8F8EE', border: '1px solid #B2DFC4', borderRadius: 20, padding: '2px 8px' }}>♥ {l}</span>
            ))}
            {allergies.length === 0 && loves.length === 0 && (
              <span style={{ fontSize: 10, color: '#999' }}>Tap to tell Mira what {petName} eats</span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 11, color: '#FF8C42', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
          Mira's picks →
        </span>
      </div>

      {/* ── Centered modal (replaces right-side drawer) ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.72)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          {/* Modal panel — min(780px, 95%) wide, 90vh max height */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 'min(780px, 100%)', maxHeight: '90vh', overflowY: 'auto',
              borderRadius: 24, background: '#fff',
              boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
              display: 'flex', flexDirection: 'column',
            }}
            data-testid="tummy-drawer"
          >
            {/* ── Dark amber header: score + progress + label ── */}
            <div style={{
              borderRadius: '24px 24px 0 0', padding: '24px 28px 20px',
              background: 'linear-gradient(135deg, #1A0A00 0%, #3D0A00 60%, #5a1200 100%)',
              flexShrink: 0, position: 'sticky', top: 0, zIndex: 2,
            }}>
              {/* Top row: label + score */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <p style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,140,66,0.90)', fontSize: 10, marginBottom: 5 }}>
                    ✦ GROW {petName.toUpperCase()}'S TUMMY PROFILE
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12 }}>
                    Answer quick questions · {petName}'s food profile is almost there
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{
                      fontSize: 72, fontWeight: 900, lineHeight: 1,
                      color: liveScore >= 80 ? '#F0C060' : '#FF8C42',
                      textShadow: liveScore >= 80
                        ? '0 0 20px rgba(240,192,96,0.6)'
                        : '0 0 20px rgba(255,140,66,0.6)',
                    }}>
                      {liveScore ?? '—'}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 18, marginBottom: 8 }}>%</span>
                  </div>
                </div>
              </div>
              {/* Progress bar (pink-purple fill, matching screenshot) */}
              <div style={{ height: 5, borderRadius: 5, background: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${liveScore || 0}%`, borderRadius: 5, background: 'linear-gradient(90deg, #FF2D87, #C44DFF)', transition: 'width 0.9s ease-out' }} />
              </div>
              {/* Close button */}
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  position: 'absolute', top: 16, right: 20,
                  background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 20, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, cursor: 'pointer', color: 'rgba(255,255,255,0.70)',
                }}
                data-testid="tummy-drawer-close"
              >✕</button>
            </div>

            {/* ── Modal body ── */}
            <div style={{ padding: '24px 28px', background: '#fff' }}>
              {/* Soul Questions — dine context, dark purple cards, 2-col grid */}
              <DineSoulQuestionsSection
                pet={pet}
                token={token}
                onScoreUpdated={(s) => setLiveScore(s)}
              />

              {/* Mira Imagines section */}
              {miraFoodCards.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontWeight: 800, color: '#1A0A00', fontSize: 16, marginBottom: 4 }}>
                    Mira Imagines for <span style={{ color: '#FF8C42' }}>{petName}</span>
                  </p>
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 16, lineHeight: 1.5 }}>
                    Based on {petName}'s soul profile — not in range yet, but Mira can request these specially.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: 14 }}>
                    {miraFoodCards.map((card, idx) => (
                      <MiraTummyImaginesCard key={idx} card={card} pet={pet} token={token} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Dimension Expanded ───────────────────────────────────────────────────────
function DimExpanded({ dim, pet, onClose, apiProducts = {} }) {
  const petName = pet?.name || "your dog";
  const catName = DIM_ID_TO_CATEGORY[dim.id];

  // All raw products for this dimension from SSOT
  const rawByTab = apiProducts[catName] || {};
  const allRaw = Object.values(rawByTab).flat();

  // Mira intelligence (client-side — no extra API call)
  const allergies = getAllergies(pet);
  const loves = getLoves(pet);
  const healthCondition = getHealthCondition(pet);
  const nutritionGoal = pet?.doggy_soul_answers?.nutrition_goal || null;
  const intelligent = applyMiraIntelligence(allRaw, allergies, loves, healthCondition, nutritionGoal, pet);

  // Dynamic tabs from actual sub_categories in API data
  const tabList = ['All', ...Object.keys(rawByTab)];
  const [activeTab, setActiveTab] = useState('All');

  const products = activeTab === 'All'
    ? intelligent
    : intelligent.filter(p => p.sub_category === activeTab);

  // Mira context for SharedProductCard
  const miraCtx = { includeText: 'Add to Cart' };

  return (
    <div style={{background:"#fff",border:"2px solid #FF8C42",borderRadius:18,padding:22,marginBottom:16,gridColumn:"1 / -1"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:14,paddingBottom:12,borderBottom:"1px solid #FFF3E0"}}>
        <span style={{fontSize:28}}>{dim.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:800,color:"#1A0A00"}}>{dim.name}</div>
          <div style={{fontSize:11,color:"#888"}}>
            {allergies.map(a=>`${a}-free`).join(" · ")}{allergies.length > 0 ? " · " : ""}
            {healthCondition ? "Treatment-safe" : "Personalised for " + petName}
          </div>
        </div>
        <button onClick={onClose} style={{background:"#FFF3E0",border:"none",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,color:"#C44400",cursor:"pointer"}}>Close ✕</button>
      </div>

      {/* Mira quote */}
      <div style={{display:"flex",alignItems:"flex-start",gap:8,background:"linear-gradient(135deg,#FFF3E0,#FDE8E8)",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
        <div style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#FF8C42,#C44DFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0}}>✦</div>
        <div>
          <p style={{fontSize:12,color:"#5A2800",fontStyle:"italic",lineHeight:1.5,margin:0}}>"{t(dim.mira, petName)}"</p>
          <span style={{fontSize:10,color:"#C44400",fontWeight:600}}>♥ Mira knows {petName}</span>
        </div>
      </div>

      {/* Dynamic sub-category tabs (from API, never hardcoded) */}
      {tabList.length > 1 && (
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {tabList.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${activeTab===tab?"#FF8C42":"#FFD0A0"}`,background:activeTab===tab?"#FF8C42":"#FFF8F0",fontSize:11,fontWeight:600,color:activeTab===tab?"#fff":"#C44400",cursor:"pointer"}}>
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Mira stats bar */}
      {allRaw.length > 0 && (
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14,fontSize:11,color:"#888"}}>
          <span style={{color:"#27AE60",fontWeight:700}}>✓ {intelligent.length} safe for {petName}</span>
          {allRaw.length - intelligent.length > 0 && (
            <span style={{color:"#E87722"}}>✗ {allRaw.length - intelligent.length} filtered (allergens)</span>
          )}
          {intelligent.filter(p => p._loved).length > 0 && (
            <span style={{color:"#E91E63",fontWeight:700}}>♥ {intelligent.filter(p => p._loved).length} match {petName}'s loves</span>
          )}
        </div>
      )}

      {/* Product grid — real ProductCard with Add to Cart + ProductDetailModal */}
      {products.length === 0 ? (
        <div style={{textAlign:"center",padding:"24px 0",color:"#888",fontSize:13}}>
          {allRaw.length === 0
            ? `Loading ${dim.name} products for ${petName}…`
            : `All ${dim.name} products were filtered — they contain ${allergies.join(', ')} which ${petName} is allergic to.`}
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(min(200px, 100%), 1fr))",gap:12}}>
          {products.map(p => (
            <div key={p.id} style={{opacity: p._dimmed ? 0.4 : 1, position:"relative"}} data-testid={`dim-product-${p.id}`}>
              {p._loved && (
                <div style={{position:"absolute",top:-6,right:-6,zIndex:2,background:"#E91E63",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff"}}>♥</div>
              )}
              {p._dimmed && (
                <div style={{position:"absolute",top:4,left:4,zIndex:2,background:"rgba(0,0,0,0.6)",borderRadius:6,padding:"2px 6px",fontSize:9,color:"#fff",fontWeight:700}}>Conflicts goal</div>
              )}
              <SharedProductCard product={p} pillar="dine" selectedPet={pet} miraContext={miraCtx} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Guided Nutrition Paths ───────────────────────────────────────────────────
// ─── Pet Friendly Spots ───────────────────────────────────────────────────────
const MOCK_SPOTS = [
  {name:"The Doggy Café",addr:"Indiranagar · 1.2km",icon:"☕",rating:"4.7",tag:"Great for Indies"},
  {name:"Paws & Brew",addr:"Koramangala · 2.4km",icon:"🌿",rating:"4.5",tag:"Outdoor seating"},
  {name:"Barkery & Co.",addr:"HSR Layout · 3.1km",icon:"🏡",rating:"4.6",tag:"Dog menu available"},
  {name:"The Pet Pantry",addr:"Whitefield · 4.8km",icon:"🍽️",rating:"4.4",tag:"Quiet — good for anxious dogs"},
  {name:"Bark & Bite",addr:"Jayanagar · 5.2km",icon:"🌟",rating:"4.8",tag:"Great for Indies"},
  {name:"Canine Kitchen",addr:"Sarjapur · 6.1km",icon:"👨‍🍳",rating:"4.3",tag:"Dog menu available"},
];

function PetFriendlySpots({ pet }) {
  const petName = pet?.name || "your dog";
  const city = pet?.city || pet?.doggy_soul_answers?.city || "your city";
  return (
    <div data-testid="pet-friendly-spots">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"#FFF3E0",border:"1px solid #FFCC99",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:600,color:"#C44400"}}>📍 Pet-friendly spots near {petName} in {city}</div>
        <button style={{background:"#fff",border:"1px solid #FFCC99",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:600,color:"#C44400",cursor:"pointer"}}>🗺️ View on map</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
        {MOCK_SPOTS.map(spot => (
          <div key={spot.name} style={{background:"#fff",border:"1px solid #F5E8D4",borderRadius:12,overflow:"hidden"}}>
            <div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,background:"#FFF8F0"}}>{spot.icon}</div>
            <div style={{padding:10}}>
              <div style={{fontSize:13,fontWeight:700,color:"#1A0A00",marginBottom:3}}>{spot.name}</div>
              <div style={{fontSize:10,color:"#888",marginBottom:6}}>{spot.addr}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:11,color:"#F59E0B",fontWeight:600}}>★ {spot.rating}</span>
                <span style={{fontSize:9,fontWeight:600,background:"#E8F5E9",color:"#2E7D32",borderRadius:8,padding:"2px 7px"}}>{spot.tag}</span>
              </div>
              <button style={{width:"100%",background:"linear-gradient(135deg,#FF8C42,#C44DFF)",color:"#fff",border:"none",borderRadius:10,padding:7,fontSize:11,fontWeight:600,cursor:"pointer"}}>Reserve via Concierge</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dining Concierge ─────────────────────────────────────────────────────────
function DiningConcierge({ pet }) {
  const petName = pet?.name || "your pet";
  const [intakeOpen, setIntakeOpen] = useState(false);

  return (
    <>
      <div
        style={{
          background: '#1A0A00',
          borderRadius: 24,
          padding: '36px 32px',
          marginBottom: 32,
          position: 'relative',
          overflow: 'hidden',
        }}
        data-testid="dining-concierge"
      >
        {/* Subtle top-left glow */}
        <div style={{
          position: 'absolute', top: -60, left: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,151,58,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Eyebrow chip */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(201,151,58,0.15)', border: '1px solid rgba(201,151,58,0.35)',
            borderRadius: 9999, padding: '5px 16px', marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, color: '#C9973A' }}>★</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(201,151,58,0.90)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {petName}'s Concierge
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontWeight: 900, color: '#FFFFFF',
            fontFamily: 'Georgia, serif',
            marginBottom: 14, lineHeight: 1.25, maxWidth: 520,
          }}>
            Dine with <span style={{ color: '#F0C060' }}>{petName}</span> the way only you know how.
          </h2>

          {/* Description */}
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.65, marginBottom: 20, maxWidth: 540,
          }}>
            From finding the perfect spot to making the reservation and checking {petName}'s breed is welcome — we handle every detail so you can just show up and enjoy.
          </p>

          {/* Chips — dine-relevant */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {[
              'Restaurant Discoveries',
              'Date Night Outings',
              'Special Occasion Dining',
              'Allergy-Safe Venues',
              'Reservation Assistance',
            ].map(chip => (
              <span
                key={chip}
                style={{
                  fontSize: 11, fontWeight: 600,
                  color: 'rgba(255,255,255,0.72)',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 9999, padding: '4px 12px',
                }}
              >
                {chip}
              </span>
            ))}
          </div>

          {/* Stat + CTA row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#F0C060', fontFamily: 'Georgia, serif', lineHeight: 1 }}>100%</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>handled for you</span>
            </div>
            <button
              onClick={() => setIntakeOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #C9973A, #F0C060)',
                color: '#1A0A00', border: 'none', borderRadius: 12,
                padding: '13px 28px', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', transition: 'all 150ms', whiteSpace: 'nowrap',
              }}
              data-testid="talk-to-concierge-btn"
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(201,151,58,0.40)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              Plan {petName}'s Dining →
            </button>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
              48h response promise
            </p>
          </div>
        </div>
      </div>

      {intakeOpen && (
        <ConciergeIntakeModal
          pet={pet}
          onClose={() => setIntakeOpen(false)}
          prefilledOccasion={null}
        />
      )}
    </>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div
      style={{ display: "flex", justifyContent: "center", gap: 8, padding: "12px 16px", background: "#FDF6EE", borderBottom: "1px solid #F0E8E0" }}
      data-testid="dine-tab-bar"
    >
      {[{ id: "eat", icon: "🍽️", label: "Eat & Nourish" }, { id: "out", icon: "🗺️", label: "Dine Out" }].map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 20px",
            fontSize: 13, fontWeight: 700,
            color: active === tab.id ? "#fff" : "#C44400",
            background: active === tab.id ? "linear-gradient(135deg, #FF8C42, #C44400)" : "#FFF3E0",
            border: `1.5px solid ${active === tab.id ? "#FF8C42" : "#FFCC99"}`,
            borderRadius: 20,
            cursor: "pointer",
            transition: "all 0.18s",
            boxShadow: active === tab.id ? "0 2px 12px rgba(196,68,0,0.30)" : "none",
          }}
          data-testid={`dine-tab-${tab.id}`}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── Loading / No Pet states ──────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#3d1200 0%,#7a2800 50%,#c44400 100%)"}} data-testid="dine-loading">
      <div style={{textAlign:"center",color:"#fff"}}>
        <div style={{fontSize:32,marginBottom:12,animation:"spin 1s linear infinite"}}>🍽️</div>
        <p style={{color:"rgba(255,255,255,0.70)"}}>Loading Mira's kitchen…</p>
      </div>
    </div>
  );
}

function NoPetState({ onAddPet }) {
  return (
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 16px",background:"linear-gradient(135deg,#3d1200 0%,#7a2800 50%,#c44400 100%)"}} data-testid="dine-no-pet">
      <div style={{textAlign:"center",maxWidth:480}}>
        <div style={{fontSize:64,marginBottom:24}}>🍽️</div>
        <h1 style={{fontSize:"clamp(1.875rem,4vw,2.5rem)",fontWeight:800,color:"#fff",marginBottom:16,fontFamily:"Georgia,serif"}}>Food &amp; Nourishment<br/>for your pet</h1>
        <p style={{fontSize:16,color:"rgba(255,255,255,0.70)",marginBottom:32}}>Add your pet to unlock a personalised nutrition experience — meals, treats, and restaurants filtered by Mira.</p>
        <button onClick={onAddPet} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 28px",borderRadius:9999,fontWeight:600,fontSize:16,cursor:"pointer",background:"linear-gradient(135deg,#FF8C42,#C44400)",color:"#fff",border:"none",boxShadow:"0 4px 20px rgba(196,68,0,0.40)"}} data-testid="dine-add-pet-btn">
          <span>✦</span><span>Add your dog to begin</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const DineSoulPage = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("eat");
  const [openDim, setOpenDim] = useState(null);
  const [petData, setPetData] = useState(null);
  const [soulScore, setSoulScore] = useState(0);
  const [apiProducts, setApiProducts] = useState({});

  // Fetch Dine products from SSOT (products_master) on mount
  useEffect(() => {
    fetch(`${API_URL}/api/admin/pillar-products?pillar=dine&limit=600`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.products?.length) return;
        const grouped = {};
        data.products.forEach(p => {
          const cat = p.category || "";
          const sub = p.sub_category || "";
          if (!grouped[cat]) grouped[cat] = {};
          if (!grouped[cat][sub]) grouped[cat][sub] = [];
          grouped[cat][sub].push(p);
        });
        setApiProducts(grouped);
      })
      .catch(e => console.error("[DineSoulPage] products fetch error:", e));
  }, []);

  useEffect(() => {
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
    if (contextPets !== undefined) setLoading(false);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (currentPet) { setPetData(currentPet); setSoulScore(currentPet.soul_score || currentPet.overall_score || 0); }
  }, [currentPet]);

  useEffect(() => {
    const handle = async (e) => {
      if (e.detail?.petId !== petData?.id) return;
      if (e.detail?.score !== undefined) setSoulScore(e.detail.score);
      // Refetch pet so miraFoodCards update with newly answered soul data
      try {
        const freshPet = await fetch(`${API_URL}/api/pets/${e.detail.petId}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }).then(r => r.ok ? r.json() : null);
        if (freshPet) { setPetData(freshPet); setCurrentPet(freshPet); }
      } catch {}
    };
    window.addEventListener("soulScoreUpdated", handle);
    return () => window.removeEventListener("soulScoreUpdated", handle);
  }, [petData?.id, token]);

  const handleAddPet = useCallback(() => {
    navigate(isAuthenticated ? "/dashboard/pets?action=add" : "/login?redirect=/dine");
  }, [isAuthenticated, navigate]);

  if (loading) return <PillarPageLayout pillar="dine" hideHero hideNavigation><LoadingState /></PillarPageLayout>;
  if (!petData) return <PillarPageLayout pillar="dine" hideHero hideNavigation><NoPetState onAddPet={handleAddPet} /></PillarPageLayout>;

  const dineDims = getDineDims(petData);
  const activeDim = dineDims.find(d => d.id === openDim);

  return (
    <PillarPageLayout pillar="dine" hideHero hideNavigation>
      <Helmet>
        <title>Dine · {petData.name} · The Doggy Company</title>
        <meta name="description" content={`Everything ${petData.name} eats, filtered by Mira.`} />
      </Helmet>

      {/* Hero — full bleed, mirrors CelebrateHero */}
      <DineHero pet={petData} soulScore={soulScore} />

      {/* Page body — max-w-5xl centred, matches Celebrate layout */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8" style={{ background: "#FDF6EE", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

        {/* Category strip — centered within max-w container (same as Celebrate) */}
        <DineCategoryStrip pet={petData} />

        {/* Tab bar — centered, amber box style */}
        <TabBar active={activeTab} onChange={setActiveTab} />

        {/* "How would Mojo love to eat?" — mirrors "How would Mojo love to celebrate?" on /celebrate */}
        <section className="py-8" data-testid="dine-how-would-section">
          <h2 style={{
            fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800,
            color: '#1A0A00', marginBottom: 6,
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}>
            How would{' '}
            <span style={{ color: '#FF8C42' }}>{petData.name}</span>{' '}
            love to eat?
          </h2>
          <p style={{ fontSize: 14, color: '#888888', lineHeight: 1.5 }}>
            Choose a dimension — everything inside is personalised to {petData.name}'s food profile.{' '}
            <span style={{ color: '#C44400', fontWeight: 600 }}>Glowing ones match what {petData.name} loves.</span>
          </p>
        </section>

        {activeTab === "eat" && (
          <>
            <TummyProfile pet={petData} token={token} />

            <div style={{ fontSize: "clamp(1.125rem,2.5vw,1.375rem)", fontWeight: 800, color: "#1A0A00", marginBottom: 4, fontFamily: "Georgia,serif" }}>Eat &amp; Nourish</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>5 dimensions, filtered to {petData.name}</div>

            {/* Dimensions grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 32 }}>
              {dineDims.map(dim => (
                <div key={dim.id} onClick={() => setOpenDim(openDim === dim.id ? null : dim.id)} style={{ background: dim.bg, borderRadius: 12, padding: "14px 12px", cursor: "pointer", position: "relative", opacity: dim.glow ? 1 : 0.60, boxShadow: dim.glow && openDim !== dim.id ? "0 0 18px rgba(255,140,66,0.18)" : "none", border: openDim === dim.id ? "2px solid #FF8C42" : "2px solid transparent", transition: "all 0.15s" }} data-testid={`dine-dim-${dim.id}`}>
                  {dim.glow && <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: dim.dot }} />}
                  <span style={{ fontSize: 22, display: "block", marginBottom: 8 }}>{dim.icon}</span>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1A0A00", marginBottom: 3 }}>{dim.name}</div>
                  <div style={{ fontSize: 13, color: "#666", lineHeight: 1.3, marginBottom: 6 }}>{t(dim.sub, petData.name)}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "2px 7px", display: "inline-block", background: dim.badgeBg, color: dim.badgeCol }}>{t(dim.badge, petData.name)}</span>
                  <span style={{ position: "absolute", bottom: 8, right: 10, fontSize: 14, color: "rgba(0,0,0,0.25)", transition: "transform 0.2s", transform: openDim === dim.id ? "rotate(90deg)" : "none" }}>›</span>
                </div>
              ))}
            </div>

            {/* Expanded panel */}
            {activeDim && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
                <DimExpanded dim={activeDim} pet={petData} onClose={() => setOpenDim(null)} apiProducts={apiProducts} />
              </div>
            )}

            {/* Mira Meal Box — below Eat & Nourish */}
            <div style={{ marginBottom: 24 }}>
              <MealBoxCard />
            </div>

            <DiningConcierge pet={petData} />

            <DineConciergeSection pet={petData} />

            <GuidedNutritionPaths pet={petData} />
          </>
        )}

        {activeTab === "out" && <PetFriendlySpots pet={petData} />}

      </div>

      {/* Mira orb — amber/terracotta for Dine */}
      <div onClick={() => window.dispatchEvent(new CustomEvent("openMiraAI", { detail: { message: `What should ${petData.name} eat today?`, context: "dine" } }))} style={{ position: "fixed", bottom: 24, right: 20, zIndex: 9996, cursor: "pointer" }} data-testid="dine-mira-orb">
        <MiraOrb pillar="dine" size="md" />
      </div>
    </PillarPageLayout>
  );
};

export default DineSoulPage;
