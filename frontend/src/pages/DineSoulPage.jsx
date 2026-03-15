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
import { API_URL } from "../utils/api";

// ─── Catalogue (matches products seeded to products_master) ─────────────────
const DINE_DIMS = [
  {
    id:"meals", icon:"🐟", name:"Daily Meals",
    sub:"Salmon-forward, soy-free, right for {name}",
    badge:"Mojo's body needs this", badgeBg:"rgba(255,140,66,0.18)", badgeCol:"#8B4500",
    bg:"linear-gradient(135deg,#FFF3E0,#FFE0B2)", dot:"#FF8C42", glow:true,
    mira:"I built this around {name}'s weight, age, and health profile. The salmon meals are first. Everything here is soy-free and treatment-safe.",
    tabs:["Morning Meal","Evening Meal","Portion Guide","Special Diets"],
    products:{
      "Morning Meal":[
        {id:"DM-001",icon:"🐟",bg:"#FFF3E0",tag:"Treatment-safe",name:"Salmon & Sweet Potato Morning Bowl",desc:"Soy-free, omega-rich, anti-inflammatory",price:"₹349"},
        {id:"DM-002",icon:"🥜",bg:"#FFF3E0",tag:"Safe for Mojo",name:"Peanut Butter & Banana Morning Mash",desc:"High-energy, senior-friendly",price:"₹299"},
        {id:"DM-004",icon:"🐑",bg:"#FFF3E0",tag:"Hypoallergenic",name:"Lamb & Quinoa Morning Bowl",desc:"Novel protein, multi-allergy safe",price:"₹399"},
        {id:"DM-009",icon:"📋",bg:"#E8F5E9",tag:"Free from Mira",name:"Treatment Nutrition Guide",desc:"Eating well through cancer treatment",price:"Free"},
      ],
      "Evening Meal":[
        {id:"DM-005",icon:"🐟",bg:"#FFF3E0",tag:"Treatment-safe",name:"Salmon & Lentil Evening Dinner",desc:"High protein, treatment-supportive",price:"₹399"},
        {id:"DM-006",icon:"🍲",bg:"#FFF3E0",tag:"Recovery meal",name:"Lamb & Vegetable Stew",desc:"Slow-cooked, nutrient-dense",price:"₹449"},
        {id:"DM-007",icon:"🐠",bg:"#FFF3E0",tag:"Safe for Mojo",name:"Fish & Brown Rice Dinner",desc:"Omega-rich, easy to digest",price:"₹379"},
      ],
      "Portion Guide":[
        {id:"DM-008",icon:"📊",bg:"#E8F5E9",tag:"Free from Mira",name:"Breed-Specific Portion Guide",desc:"Tailored for your dog's size and age",price:"Free"},
        {id:"DM-009b",icon:"📋",bg:"#E8F5E9",tag:"For Mojo",name:"Treatment Nutrition Guide",desc:"Eating well through treatment",price:"Free"},
      ],
      "Special Diets":[
        {id:"DM-010",icon:"🌿",bg:"#FFF3E0",tag:"For seniors",name:"Senior Wellness Meal Pack",desc:"7-day, joint-supportive",price:"₹1,999"},
        {id:"DM-012",icon:"💚",bg:"#E8F5E9",tag:"Treatment-safe",name:"Post-Treatment Recovery Meals",desc:"Gentle nutrition for healing",price:"₹1,799"},
      ],
    },
  },
  {
    id:"treats", icon:"🦴", name:"Treats & Rewards",
    sub:"Salmon biscuits first — {name} loves these",
    badge:"Mojo loves these", badgeBg:"rgba(233,30,99,0.18)", badgeCol:"#880E4F",
    bg:"linear-gradient(135deg,#FCE4EC,#F8BBD0)", dot:"#E91E63", glow:true,
    mira:"Everything here is soy-free and chicken-free. The salmon biscuits are first because {name} loves them.",
    tabs:["Everyday Treats","Training Rewards","Birthday Treats","Allergy-Safe"],
    products:{
      "Everyday Treats":[
        {id:"TR-001",icon:"🍪",bg:"#FCE4EC",tag:"Mojo's #1",name:"Salmon Biscuit Box",desc:"12 hand-baked, soy-free, chicken-free",price:"₹449"},
        {id:"TR-002",icon:"🥜",bg:"#FCE4EC",tag:"Safe for Mojo",name:"Peanut Butter Drops",desc:"Soft, small, no xylitol",price:"₹349"},
        {id:"TR-003",icon:"🥕",bg:"#FCE4EC",tag:"Light reward",name:"Mixed Veggie Chews",desc:"Low calorie, great for teeth",price:"₹299"},
        {id:"TR-004",icon:"🐑",bg:"#FCE4EC",tag:"Hypoallergenic",name:"Lamb Jerky Strips",desc:"Novel protein, long-lasting chew",price:"₹399"},
      ],
      "Training Rewards":[
        {id:"TR-005",icon:"🎯",bg:"#FCE4EC",tag:"Training pick",name:"Salmon Training Bites",desc:"Tiny, high-value, soy-free",price:"₹299"},
        {id:"TR-006",icon:"🥜",bg:"#FCE4EC",tag:"Training pick",name:"Peanut Butter Training Bites",desc:"Soft, quick to eat",price:"₹279"},
        {id:"TR-007",icon:"⭐",bg:"#FCE4EC",tag:"High-value reward",name:"Freeze-Dried Liver Bites",desc:"Ultra high-value — use sparingly",price:"₹349"},
      ],
      "Birthday Treats":[
        {id:"TR-008",icon:"🎂",bg:"#FCE4EC",tag:"Birthday cake",name:"Birthday Salmon Cake",desc:"Soy-free, hand-decorated, fresh",price:"₹899"},
        {id:"TR-009",icon:"🎁",bg:"#FCE4EC",tag:"Birthday platter",name:"Birthday Treat Platter",desc:"12 mixed treats, birthday box",price:"₹649"},
        {id:"TR-010",icon:"🧁",bg:"#FCE4EC",tag:"Pawty ready",name:"Paw Print Birthday Cupcakes",desc:"6-pack, soy-free",price:"₹549"},
      ],
      "Allergy-Safe":[
        {id:"TR-011",icon:"🛡️",bg:"#E8F5E9",tag:"Multi-allergy safe",name:"Allergy-Safe Variety Pack",desc:"Free of 7 common allergens",price:"₹499"},
        {id:"TR-012",icon:"🐟",bg:"#E8F5E9",tag:"Single ingredient",name:"Salmon-Only Biscuits",desc:"One ingredient. Nothing else.",price:"₹379"},
      ],
    },
  },
  {
    id:"supplements", icon:"💊", name:"Supplements",
    sub:"Treatment-safe, vet-checked",
    badge:"Health priority", badgeBg:"rgba(76,175,80,0.18)", badgeCol:"#2E7D32",
    bg:"linear-gradient(135deg,#E8F5E9,#C8E6C9)", dot:"#4CAF50", glow:true,
    mira:"These are the supplements I would choose for {name} right now — every one is treatment-safe, vet-checked, and soy-free.",
    tabs:["Immunity & Treatment","Joint & Mobility","Digestion & Gut","Skin & Coat"],
    products:{
      "Immunity & Treatment":[
        {id:"SP-001",icon:"🛡️",bg:"#E8F5E9",tag:"Treatment-safe",name:"Canine Immunity Booster",desc:"Antioxidants, lymphoma-safe, vet-checked",price:"₹899"},
        {id:"SP-002",icon:"🌿",bg:"#E8F5E9",tag:"Treatment-safe",name:"Turmeric & Black Pepper",desc:"Natural anti-inflammatory",price:"₹549"},
        {id:"SP-003",icon:"🍄",bg:"#E8F5E9",tag:"Lymphoma support",name:"Medicinal Mushroom Complex",desc:"Turkey Tail — lymphoma research",price:"₹1,299"},
        {id:"SP-004",icon:"⚡",bg:"#E8F5E9",tag:"Treatment-safe",name:"Vitamin B Complex",desc:"Energy support during treatment",price:"₹649"},
      ],
      "Joint & Mobility":[
        {id:"SP-005",icon:"🦴",bg:"#E3F2FD",tag:"Joint support",name:"Glucosamine & Chondroitin",desc:"Salmon-flavoured chewable tablet",price:"₹799"},
        {id:"SP-006",icon:"🐚",bg:"#E3F2FD",tag:"Premium joint",name:"Green-Lipped Mussel Powder",desc:"Natural omega-3 + joint nutrients",price:"₹999"},
      ],
      "Digestion & Gut":[
        {id:"SP-007",icon:"🌱",bg:"#FFF3E0",tag:"Treatment-safe",name:"Probiotic Powder",desc:"10 billion CFU — daily gut health",price:"₹549"},
        {id:"SP-008",icon:"🔬",bg:"#FFF3E0",tag:"Absorption support",name:"Digestive Enzyme Blend",desc:"Supports nutrient absorption",price:"₹699"},
      ],
      "Skin & Coat":[
        {id:"SP-010",icon:"🐟",bg:"#FCE4EC",tag:"Treatment-safe",name:"Salmon Oil — Omega 3 & 6",desc:"Cold-pressed, anti-inflammatory",price:"₹699"},
        {id:"SP-011",icon:"🥥",bg:"#FCE4EC",tag:"Coat nourishing",name:"Coconut Oil",desc:"Antifungal, antibacterial, coat health",price:"₹449"},
      ],
    },
  },
  {
    id:"frozen", icon:"🧊", name:"Frozen & Fresh",
    sub:"Cold-pressed options for {name}",
    badge:"Explore", badgeBg:"rgba(0,0,0,0.08)", badgeCol:"#555555",
    bg:"linear-gradient(135deg,#E3F2FD,#BBDEFB)", dot:"#2196F3", glow:false,
    mira:"Tell me if {name} prefers cold-pressed or raw food and I'll build this section around that preference.",
    tabs:["Cold Pressed","Raw","Freeze Dried","Fresh Cooked"],
    products:{
      "Cold Pressed":[
        {id:"FF-001",icon:"❄️",bg:"#E3F2FD",tag:"Cold press pick",name:"Salmon & Vegetable Patty",desc:"Gently processed, max nutrition",price:"₹549"},
        {id:"FF-002",icon:"🐑",bg:"#E3F2FD",tag:"Hypoallergenic",name:"Lamb & Quinoa Patty",desc:"Novel protein, multi-allergy safe",price:"₹599"},
      ],
      "Raw":[{id:"FF-003",icon:"🐟",bg:"#E8F5E9",tag:"BARF compatible",name:"Raw Salmon Mince",desc:"Single protein, soy-free",price:"₹499"}],
      "Freeze Dried":[{id:"FF-004",icon:"✨",bg:"#FFFDE7",tag:"Convenience pick",name:"Freeze Dried Salmon Nuggets",desc:"Raw nutrition, shelf-stable",price:"₹799"}],
      "Fresh Cooked":[{id:"FF-005",icon:"🍳",bg:"#FFF3E0",tag:"Fresh delivered",name:"Salmon Weekly Box",desc:"Home-cooked quality, weekly delivery",price:"₹2,499"}],
    },
  },
  {
    id:"homemade", icon:"🍳", name:"Homemade & Recipes",
    sub:"Recipes built around {name}'s allergies",
    badge:"Explore", badgeBg:"rgba(0,0,0,0.08)", badgeCol:"#555555",
    bg:"linear-gradient(135deg,#FFFDE7,#FFF9C4)", dot:"#F9A825", glow:false,
    mira:"These recipes are built around what {name} loves and what their body can handle. No soy, no chicken. Everything here is safe.",
    tabs:["Quick Recipes","Weekend Recipes","Special Occasion","Ingredient Guide"],
    products:{
      "Quick Recipes":[
        {id:"HR-001",icon:"📝",bg:"#FFFDE7",tag:"Free recipe",name:"Salmon & Sweet Potato Biscuits",desc:"20 minutes, makes 24 biscuits",price:"Free"},
        {id:"HR-002",icon:"🧊",bg:"#FFFDE7",tag:"Free recipe",name:"Peanut Butter Frozen Treats",desc:"5 ingredients, freeze-ahead",price:"Free"},
        {id:"HR-005",icon:"📦",bg:"#FFF3E0",tag:"Ready to cook",name:"Salmon & Oat Ingredient Pack",desc:"Pre-measured, everything included",price:"₹349"},
      ],
      "Weekend Recipes":[{id:"HR-003",icon:"🍲",bg:"#FFFDE7",tag:"Recovery recipe",name:"Slow-Cooked Lamb Stew",desc:"Makes 7 servings, freeze in portions",price:"Free"}],
      "Special Occasion":[
        {id:"HR-004",icon:"🎂",bg:"#FFFDE7",tag:"Birthday recipe",name:"DIY Salmon Birthday Cake",desc:"Full recipe including frosting",price:"Free"},
        {id:"HR-007",icon:"📦",bg:"#FFF3E0",tag:"Birthday pack",name:"Birthday Cake Ingredient Pack",desc:"Everything pre-measured",price:"₹499"},
      ],
      "Ingredient Guide":[{id:"HR-006",icon:"📋",bg:"#E8F5E9",tag:"Free from Mira",name:"Doggy Safe Ingredients Guide",desc:"Safe and unsafe — complete list",price:"Free"}],
    },
  },
];

const CONC_SERVICES = [
  {icon:"🔍",sub:"COMPLIMENTARY",name:"Pet-Friendly Restaurant Discovery",desc:"We find venues that genuinely welcome dogs — not just allow them. There is a difference, and we know it.",free:true,cta:"Find us a restaurant →"},
  {icon:"📅",sub:"RESERVATION",name:"Reservation Assistance",desc:"We make the booking, confirm dog-friendliness, and arrange any special requests before you arrive.",free:false,cta:"Make the reservation →"},
  {icon:"🎓",sub:"FIRST TIME OUT",name:"Dining Etiquette Guidance",desc:"First time dining out with {name}? We prepare you both. What to bring, what signals to watch for.",free:true,cta:"Prepare us for the outing →"},
  {icon:"📍",sub:"COMPLIMENTARY",name:"Venue Suitability Advisory",desc:"Tell us the venue. Tell us about {name}. We assess if it is the right match for their personality.",free:true,cta:"Assess this venue for {name} →"},
];

// ─── Category → dim mapping (used for dynamic product lookup) ────────────────
const DIM_ID_TO_CATEGORY = {
  meals:       "Daily Meals",
  treats:      "Treats & Rewards",
  supplements: "Supplements",
  frozen:      "Frozen & Fresh",
  homemade:    "Homemade & Recipes",
};

const CATEGORY_BG = {
  "Daily Meals":        "#FFF3E0",
  "Treats & Rewards":   "#FCE4EC",
  "Supplements":        "#E8F5E9",
  "Frozen & Fresh":     "#E3F2FD",
  "Homemade & Recipes": "#FFFDE7",
};

function getDineProductIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("salmon"))        return "🐟";
  if (n.includes("lamb"))          return "🐑";
  if (n.includes("chicken"))       return "🐔";
  if (n.includes("peanut butter")) return "🥜";
  if (n.includes("birthday cake") || n.includes("cupcake")) return "🎂";
  if (n.includes("birthday"))      return "🎁";
  if (n.includes("veggie") || n.includes("vegetable")) return "🥕";
  if (n.includes("mushroom"))      return "🍄";
  if (n.includes("probiotic"))     return "🌱";
  if (n.includes("glucosamine"))   return "🦴";
  if (n.includes("vitamin"))       return "💊";
  if (n.includes("coconut oil"))   return "🥥";
  if (n.includes("oil"))           return "💧";
  if (n.includes("fish"))          return "🐠";
  if (n.includes("guide") || n.includes("recipe")) return "📝";
  if (n.includes("pack"))          return "📦";
  if (n.includes("platter"))       return "🍽️";
  return "🐾";
}

function adaptDineProduct(p) {
  const price = p.price;
  return {
    id:    p.id,
    icon:  getDineProductIcon(p.name),
    bg:    CATEGORY_BG[p.category] || "#FFF3E0",
    tag:   p.mira_tag || p.category || "",
    name:  p.name,
    desc:  p.allergy_free || (p.description ? p.description.slice(0, 70) : ""),
    price: !price || price === 0 ? "Free" : `₹${Number(price).toLocaleString("en-IN")}`,
  };
}

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

function ProductCard({ product }) {
  const [added, setAdded] = useState(false);
  const isFree = product.price === "Free";
  return (
    <div style={{borderRadius:12,border:"1px solid #F0E8F8",background:"#fff",overflow:"hidden"}}>
      <div style={{height:64,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,background:product.bg||"#FFF3E0"}}>{product.icon}</div>
      <div style={{padding:8}}>
        <div style={{display:"inline-block",background:"linear-gradient(135deg,rgba(255,140,66,0.12),rgba(196,77,255,0.10))",border:"1px solid rgba(255,140,66,0.25)",borderRadius:8,padding:"1px 6px",fontSize:9,color:"#8B4500",fontWeight:600,marginBottom:4}}>✦ {product.tag}</div>
        <div style={{fontSize:11,fontWeight:700,color:"#1A0A00",marginBottom:2}}>{product.name}</div>
        <div style={{fontSize:10,color:"#888",lineHeight:1.3,marginBottom:6}}>{product.desc}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:12,fontWeight:700,color:isFree?"#27AE60":"#1A0A00"}}>{product.price}</span>
          <button onClick={() => setAdded(true)} style={{background:added?"#E8F5E9":"linear-gradient(135deg,#FF8C42,#C44DFF)",color:added?"#27AE60":"#fff",border:added?"1px solid #BBF7D0":"none",borderRadius:10,padding:"3px 8px",fontSize:9,fontWeight:700,cursor:"pointer"}}>
            {added?"✓ Added":isFree?"Get Free":"Add"}
          </button>
        </div>
      </div>
    </div>
  );
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
      background: 'linear-gradient(135deg, #3d1200 0%, #7a2800 100%)',
      border: '1.5px solid rgba(255,140,66,0.40)',
      minHeight: 140,
      boxShadow: '0 4px 20px rgba(196,68,0,0.15)',
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
              borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600,
              background: selected === opt ? 'rgba(255,140,66,0.35)' : 'rgba(255,255,255,0.07)',
              border: selected === opt ? '1.5px solid #FF8C42' : '1px solid rgba(255,255,255,0.18)',
              color: selected === opt ? '#FFD080' : 'rgba(255,255,255,0.70)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{opt}</button>
          ))}
        </div>
      )}

      {question.type === 'multi_select' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {(question.options || []).slice(0, 6).map(opt => (
            <button key={opt} onClick={() => toggleMulti(opt)} style={{
              borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600,
              background: multiSelected.includes(opt) ? 'rgba(255,140,66,0.35)' : 'rgba(255,255,255,0.07)',
              border: multiSelected.includes(opt) ? '1.5px solid #FF8C42' : '1px solid rgba(255,255,255,0.18)',
              color: multiSelected.includes(opt) ? '#FFD080' : 'rgba(255,255,255,0.70)',
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

// ─── Food emoji helper ────────────────────────────────────────────────────────
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
    imagines.push({
      emoji: getFoodEmoji(key),
      bg: 'linear-gradient(135deg, #1A0A00, #3d1200)',
      name: `${label} Grain-Free Bowl`,
      desc: `A complete, ${label.toLowerCase()}-rich meal formulated just for ${petName}`,
      reason: `Because ${petName} loves ${food}`,
    });
    if (imagines.length < 4) {
      imagines.push({
        emoji: '🎁',
        bg: 'linear-gradient(135deg, #0d1a00, #1a3000)',
        name: `${label} Weekly Treat Pack`,
        desc: `Curated ${label.toLowerCase()} treats, perfectly sized for ${petName}`,
        reason: `Because ${petName} loves ${food} treats`,
      });
    }
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

// ─── Mira Tummy Imagines Card ─────────────────────────────────────────────────
function MiraTummyImaginesCard({ card, onAskMira }) {
  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden', position: 'relative',
      background: card.bg || 'linear-gradient(135deg, #1A0A00, #3d1200)',
      border: '1.5px solid rgba(255,140,66,0.35)',
    }}>
      <div style={{
        position: 'absolute', top: 10, left: 10, zIndex: 2,
        borderRadius: 20, padding: '3px 10px', fontSize: 9, fontWeight: 700,
        background: 'linear-gradient(135deg, #FF8C42, #C44400)', color: '#fff',
      }}>
        Mira Imagines
      </div>
      <div style={{
        height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 38, background: 'rgba(0,0,0,0.18)',
      }}>
        {card.emoji}
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <p style={{ fontWeight: 800, color: '#fff', fontSize: 12, marginBottom: 4, lineHeight: 1.3 }}>{card.name}</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginBottom: 6, lineHeight: 1.4 }}>{card.desc}</p>
        <p style={{ fontSize: 9, fontWeight: 600, color: '#FFB366', marginBottom: 10 }}>{card.reason}</p>
        <button
          onClick={onAskMira}
          style={{
            width: '100%', borderRadius: 8, padding: '6px', fontSize: 10, fontWeight: 700,
            background: 'rgba(255,140,66,0.18)', border: '1px solid rgba(255,140,66,0.38)',
            color: '#FFB366', cursor: 'pointer',
          }}
        >
          Ask Mira to Source →
        </button>
      </div>
    </div>
  );
}

// ─── Dine Soul Questions Section (amber-themed — mirrors SoulQuestionsSection) ─
function DineSoulQuestionsSection({ pet, token, onScoreUpdated }) {
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(null);
  const [prevScore, setPrevScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPts, setTotalPts] = useState(0);
  const petName = pet?.name || 'your pet';
  const isGold = (score || 0) >= 80;

  const loadQuestions = useCallback(() => {
    if (!pet?.id) { setLoading(false); return; }
    fetch(`${API_URL}/api/pet-soul/profile/${pet.id}/quick-questions?limit=5&context=dine`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setQuestions((data.questions || []).map(q => ({ ...q, pet_id: pet.id })));
          setScore(s => {
            if (s === null) setPrevScore(data.current_score);
            return data.current_score;
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pet?.id]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const handleAnswered = useCallback((newScore, pts) => {
    setAnsweredCount(prev => prev + 1);
    setTotalPts(prev => prev + (pts || 0));
    if (newScore !== undefined) {
      setPrevScore(score);
      setScore(newScore);
      onScoreUpdated?.(newScore);
      window.dispatchEvent(new CustomEvent('soulScoreUpdated', { detail: { petId: pet.id, score: newScore } }));
    }
    setTimeout(() => loadQuestions(), 800);
  }, [score, pet?.id, loadQuestions, onScoreUpdated]);

  const visibleQuestions = questions.slice(0, Math.max(0, 5 - answeredCount));

  if (loading) return null;
  if (visibleQuestions.length === 0 && answeredCount === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Big amber soul score header */}
      <div style={{
        borderRadius: 20, padding: '20px 24px', marginBottom: 16,
        background: 'linear-gradient(135deg, #1A0A00 0%, #3D0A00 100%)',
        border: '1.5px solid rgba(255,140,66,0.45)',
        boxShadow: '0 0 32px rgba(196,68,0,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
              color: 'rgba(255,140,66,0.85)', fontSize: 9, marginBottom: 4,
            }}>
              ✦ GROW {petName.toUpperCase()}'S SOUL
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>
              Answer quick questions · {visibleQuestions.length} remaining
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <span style={{
                fontSize: 64, fontWeight: 900, lineHeight: 1,
                color: isGold ? '#F0C060' : '#FF8C42',
                textShadow: isGold
                  ? '0 0 16px rgba(240,192,96,0.5), 0 0 48px rgba(240,192,96,0.35)'
                  : '0 0 16px rgba(255,140,66,0.5), 0 0 48px rgba(255,140,66,0.35)',
              }}>
                {score ?? '--'}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 16, marginBottom: 6 }}>%</span>
            </div>
            <div style={{ width: 64, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.10)', overflow: 'hidden', marginTop: 8 }}>
              <div style={{
                height: '100%', width: `${score || 0}%`, borderRadius: 4,
                background: isGold ? 'linear-gradient(90deg, #FF8C42, #F0C060)' : 'linear-gradient(90deg, #FF8C42, #C44400)',
                transition: 'width 0.9s ease-out',
              }} />
            </div>
          </div>
        </div>
      </div>

      {answeredCount > 0 && (
        <div style={{
          marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 12,
          background: 'rgba(80,220,120,0.08)', border: '1px solid rgba(80,220,120,0.25)',
        }}>
          <Check size={14} style={{ color: '#50DC78', flexShrink: 0 }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: '#50DC78' }}>
            {answeredCount} answer{answeredCount > 1 ? 's' : ''} saved · +{totalPts} pts · Soul score: {score}%
          </p>
        </div>
      )}

      {visibleQuestions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 12 }}>
          {visibleQuestions.map(q => (
            <SoulQuestionCardDine key={q.question_id} question={q} petName={petName} token={token} onAnswered={handleAnswered} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <a href={`/pet-soul/${pet?.id}`} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(196,68,0,0.75)', textDecoration: 'none' }}>
          See full soul profile →
        </a>
      </div>
    </div>
  );
}

// ─── TummyProfile — compact bar + right-side drawer (exactly like Mira's Picks) ─
function TummyProfile({ pet, token }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const allergies = getAllergies(pet);
  const loves = getLoves(pet);
  const healthCondition = getHealthCondition(pet);
  const petName = pet?.name || 'your dog';
  const miraFoodCards = generateFoodImagines(pet, loves, allergies, healthCondition);

  const openMira = () => window.dispatchEvent(new CustomEvent('openMiraAI', {
    detail: { message: `Source a custom meal for ${petName}`, context: 'dine' }
  }));

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

      {/* ── Right-side drawer ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }}
          />
          {/* Panel */}
          <div
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '92%', maxWidth: 460,
              background: '#FDF6EE', zIndex: 1001, overflowY: 'auto',
              boxShadow: '-8px 0 48px rgba(0,0,0,0.25)',
            }}
            data-testid="tummy-drawer"
          >
            {/* Sticky header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #F0E8E0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0, background: '#FDF6EE', zIndex: 2,
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🌟</span>
                  <span style={{ fontWeight: 800, color: '#1A0A00', fontSize: 16 }}>Mira's Tummy Picks</span>
                </div>
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  For <span style={{ color: '#FF8C42', fontWeight: 700 }}>{petName}</span>
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999', lineHeight: 1 }}
                data-testid="tummy-drawer-close"
              >✕</button>
            </div>

            {/* Drawer body */}
            <div style={{ padding: '20px 20px 48px' }}>
              {/* ✦ Mira Imagines — Just for [Pet] */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#C44400', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  ✦ Mira Imagines — Just for {petName}
                </p>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 14, lineHeight: 1.5 }}>
                  Based on {petName}'s soul profile — not in range yet, but Mira can request these specially.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(160px, 100%), 1fr))', gap: 12 }}>
                  {miraFoodCards.map((card, idx) => (
                    <MiraTummyImaginesCard key={idx} card={card} onAskMira={openMira} />
                  ))}
                </div>
                <div style={{ margin: '24px 0 4px', borderTop: '1px solid #F0E8E0' }} />
              </div>

              {/* Soul Questions — dine context, amber theme */}
              <DineSoulQuestionsSection
                pet={pet}
                token={token}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Dimension Expanded ───────────────────────────────────────────────────────
function DimExpanded({ dim, pet, onClose, apiProducts = {} }) {
  const [activeTab, setActiveTab] = useState(dim.tabs[0]);
  const petName = pet?.name || "your dog";
  const allergies = getAllergies(pet);

  // Prefer live API products, fall back to hardcoded catalog
  const catName = DIM_ID_TO_CATEGORY[dim.id];
  const liveProducts = apiProducts[catName]?.[activeTab] || [];
  const products = liveProducts.length > 0
    ? liveProducts.map(adaptDineProduct)
    : (dim.products[activeTab] || []);
  return (
    <div style={{background:"#fff",border:"2px solid #FF8C42",borderRadius:18,padding:22,marginBottom:16,gridColumn:"1 / -1"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:14,paddingBottom:12,borderBottom:"1px solid #FFF3E0"}}>
        <span style={{fontSize:28}}>{dim.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:800,color:"#1A0A00"}}>{dim.name}</div>
          <div style={{fontSize:11,color:"#888"}}>{allergies.map(a=>`${a}-free`).join(" · ")}{allergies.length > 0 ? " · " : ""}Treatment-safe</div>
        </div>
        <button onClick={onClose} style={{background:"#FFF3E0",border:"none",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,color:"#C44400",cursor:"pointer"}}>Close ✕</button>
      </div>
      <div style={{display:"flex",alignItems:"flex-start",gap:8,background:"linear-gradient(135deg,#FFF3E0,#FDE8E8)",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
        <div style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#FF8C42,#C44DFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",flexShrink:0}}>✦</div>
        <div>
          <p style={{fontSize:12,color:"#5A2800",fontStyle:"italic",lineHeight:1.5,margin:0}}>"{t(dim.mira, petName)}"</p>
          <span style={{fontSize:10,color:"#C44400",fontWeight:600}}>♥ Mira knows {petName}</span>
        </div>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {dim.tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${activeTab===tab?"#FF8C42":"#FFD0A0"}`,background:activeTab===tab?"#FF8C42":"#FFF8F0",fontSize:11,fontWeight:600,color:activeTab===tab?"#fff":"#C44400",cursor:"pointer"}}>{tab}</button>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

// ─── Mira Meal Pick ───────────────────────────────────────────────────────────
function MiraMealPick({ pet }) {
  const petName = pet?.name || "your dog";
  const allergies = getAllergies(pet);
  const healthCondition = getHealthCondition(pet);
  const openMira = () => window.dispatchEvent(new CustomEvent("openMiraAI", {detail:{message:`Build a weekly meal plan for ${petName}`,context:"dine"}}));
  return (
    <div style={{background:"linear-gradient(135deg,#3d1200,#7a2800)",borderRadius:20,padding:28,marginBottom:32,display:"flex",alignItems:"center",gap:24}} data-testid="mira-meal-pick">
      <div style={{flex:1}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,140,66,0.20)",border:"1px solid rgba(255,140,66,0.40)",borderRadius:20,padding:"3px 10px",color:"#FFC080",fontSize:10,fontWeight:600,marginBottom:10}}>✦ Mira's meal pick for {petName}</div>
        <div style={{fontSize:"clamp(1.25rem,3vw,1.5rem)",fontWeight:800,color:"#fff",marginBottom:6}}>The {petName} Meal Pick</div>
        <p style={{fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.65,marginBottom:14}}>
          {healthCondition
            ? `I've built this around ${petName}'s ${healthCondition}. Every item supports their treatment and strength. Nothing harmful. Everything nourishing.`
            : allergies.length > 0
              ? `${allergies.map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join("-free, ")}-free. Everything right for ${petName} at their stage.`
              : `I've matched this to ${petName}'s weight, age, and what they love. Everything right for them right now.`
          }
        </p>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:18}}>
          {["🌅 Salmon fresh meal","🌙 Sweet potato bowl","🦴 Salmon biscuits","💊 Immunity booster"].map(chip => (
            <span key={chip} style={{background:"rgba(255,255,255,0.10)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,padding:"4px 10px",color:"#fff",fontSize:11}}>{chip}</span>
          ))}
        </div>
        <button onClick={openMira} style={{background:"linear-gradient(135deg,#FF8C42,#C44DFF)",color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Order {petName}'s Weekly Plan →</button>
      </div>
      <div style={{flexShrink:0,textAlign:"center"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#FF8C42,#C44DFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,marginBottom:6}}>🍽️</div>
        <div style={{color:"rgba(255,255,255,0.55)",fontSize:11}}>Curated by Mira</div>
      </div>
    </div>
  );
}

// ─── Guided Nutrition Paths ───────────────────────────────────────────────────
function GuidedNutritionPaths({ pet }) {
  const [openPath, setOpenPath] = useState("allergy");
  const petName = pet?.name || "your dog";
  const allergies = getAllergies(pet);
  const healthCondition = getHealthCondition(pet);
  const paths = [
    {id:"allergy",icon:"🛡️",iconBg:"#FEF0F0",badge:"Mira Pick",badgeBg:"#C0392B",title:"Allergy Navigation Path",desc:`Already know about ${allergies[0]||"allergies"}. Mira guides you to check for more — elimination, novel proteins, reintroduction.`,steps:["Identify symptoms","Elimination diet","Novel proteins","Reintroduction"]},
    {id:"health",icon:"💜",iconBg:"#F0ECFF",badge:"Mira Pick",badgeBg:"#4B0082",title:"Health Nutrition Path",desc:`Nutrition protocol tailored to ${petName}'s ${healthCondition||"specific health condition"} — joints, digestion, immunity, or more.`,steps:["Treatment-safe foods","Anti-inflammatory plan","Supplement schedule","Recovery meals"]},
    {id:"homemade",icon:"👩‍🍳",iconBg:"#FFF8E8",badge:"Mira Pick",badgeBg:"#C9973A",title:"Homemade Cooking Path",desc:`Safe, balanced recipes you can make at home — allergy-filtered and vet-reviewed.`,steps:["Safe ingredients","Simple recipes","Portion guide","Weekly plan"]},
  ];
  return (
    <div style={{marginBottom:32}} data-testid="guided-nutrition-paths">
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:4}}>
        <div style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:"#1A0A00",fontFamily:"Georgia,serif"}}>Guided Nutrition Paths</div>
        <button style={{background:"none",border:"1.5px solid #E0D0C0",borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:600,color:"#888",cursor:"pointer"}}>See all 6</button>
      </div>
      <div style={{fontSize:12,color:"#888",marginBottom:18}}>Mira picked {paths.length} paths for {petName}</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {paths.map(path => (
          <div key={path.id}>
            <div onClick={() => setOpenPath(openPath===path.id?null:path.id)} style={{background:openPath===path.id?(path.id==="allergy"?"#FFF0F0":path.id==="health"?"#F0ECFF":"#FFF8E8"):"#fff",border:`1.5px solid ${openPath===path.id?(path.id==="allergy"?"#F5C6C6":path.id==="health"?"#C5AEFF":"#FFE5A0"):"#F0E8E0"}`,borderRadius:14,padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"all 0.15s"}}>
              <div style={{width:40,height:40,borderRadius:10,background:path.iconBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{path.icon}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{fontSize:14,fontWeight:700,color:"#1A0A00"}}>{path.title}</span>
                  <span style={{background:path.badgeBg,color:"#fff",fontSize:10,fontWeight:700,borderRadius:20,padding:"2px 8px"}}>{path.badge}</span>
                </div>
                <div style={{fontSize:12,color:"#555",lineHeight:1.5}}>{path.desc}</div>
              </div>
              <span style={{fontSize:16,color:"#ccc",flexShrink:0,transform:openPath===path.id?"rotate(90deg)":"none",transition:"transform 0.2s"}}>›</span>
            </div>
            {openPath===path.id && (
              <div style={{background:"#fff",border:`1.5px solid ${path.id==="allergy"?"#F5C6C6":path.id==="health"?"#C5AEFF":"#FFE5A0"}`,borderTop:"none",borderRadius:"0 0 14px 14px",padding:"16px 18px 18px"}}>
                <div style={{fontSize:10,fontWeight:700,color:path.badgeBg,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Path Steps</div>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                  {path.steps.map((step,i) => (
                    <div key={step} style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:24,height:24,borderRadius:"50%",border:`1.5px solid ${path.badgeBg}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:path.badgeBg,flexShrink:0}}>{i+1}</div>
                      <span style={{fontSize:13,color:"#1A0A00"}}>{step}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => window.dispatchEvent(new CustomEvent("openMiraAI",{detail:{message:`Start the ${path.title} for ${petName}`,context:"dine"}}))} style={{width:"100%",background:path.badgeBg,color:"#fff",border:"none",borderRadius:10,padding:11,fontSize:13,fontWeight:700,cursor:"pointer"}}>Start this path with Mira →</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const petName = pet?.name || "your dog";
  const breed = pet?.breed || "your dog's breed";
  const openMira = () => window.dispatchEvent(new CustomEvent("openMiraAI",{detail:{message:`Plan a dining out experience for ${petName}`,context:"dine"}}));
  return (
    <div style={{background:"linear-gradient(135deg,#FFF8F0,#FFF0F8)",borderRadius:20,border:"1px solid #F5E8D4",padding:24,marginBottom:32}} data-testid="dining-concierge">
      <div style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:"#1A0A00",marginBottom:4,fontFamily:"Georgia,serif"}}>Dining Concierge Services</div>
      <div style={{fontSize:13,color:"#888",marginBottom:20}}>Concierge-led support for every dining out moment — from finding the right place to making sure {petName} is welcome.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {CONC_SERVICES.map(svc => (
          <div key={svc.name} style={{background:"#fff",borderRadius:14,border:"1px solid #F5E8D4",overflow:"hidden"}}>
            <div style={{height:80,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,background:"linear-gradient(135deg,#FFF3E0,#FFF0F8)"}}>{svc.icon}</div>
            <div style={{padding:10}}>
              {svc.free && <div style={{display:"inline-block",background:"#E8F5E9",color:"#2E7D32",fontSize:9,fontWeight:700,borderRadius:8,padding:"2px 7px",marginBottom:4}}>Complimentary</div>}
              <div style={{fontSize:12,fontWeight:700,color:"#1A0A00",marginBottom:4}}>{svc.name}</div>
              <div style={{fontSize:10,color:"#888",lineHeight:1.4,marginBottom:8}}>{t(svc.desc, petName)}</div>
              <button onClick={openMira} style={{fontSize:11,color:"#C44400",fontWeight:600,background:"none",border:"none",padding:0,cursor:"pointer"}}>{t(svc.cta, petName)}</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{background:"#1A0A00",borderRadius:20,padding:28,display:"flex",alignItems:"center",gap:24}}>
        <div style={{flex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(201,151,58,0.20)",border:"1px solid rgba(201,151,58,0.40)",borderRadius:20,padding:"4px 12px",color:"#F0C060",fontSize:11,fontWeight:600,marginBottom:12}}>👑 Dining Concierge®</div>
          <div style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:"#fff",marginBottom:8,fontFamily:"Georgia,serif"}}>Want us to plan the whole outing?</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.60)",lineHeight:1.7,marginBottom:18}}>You tell us where you want to take {petName}.<br/>We find the right venue, check {breed} suitability, confirm outdoor seating, make the reservation, and have a safe treat waiting when you arrive.</div>
          <button onClick={openMira} style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#C9973A,#F0C060)",color:"#1A0A00",border:"none",borderRadius:10,padding:"12px 24px",fontSize:14,fontWeight:800,cursor:"pointer"}}>👑 Talk to your Concierge</button>
        </div>
        <div style={{flexShrink:0,textAlign:"center"}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(201,151,58,0.20)",border:"2px solid rgba(201,151,58,0.40)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 8px"}}>👑</div>
          <div style={{fontSize:22,fontWeight:900,color:"#F0C060"}}>100%</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.50)",marginBottom:6}}>handled for you</div>
        </div>
      </div>
    </div>
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
    const handle = e => { if (e.detail?.petId === petData?.id && e.detail?.score !== undefined) setSoulScore(e.detail.score); };
    window.addEventListener("soulScoreUpdated", handle);
    return () => window.removeEventListener("soulScoreUpdated", handle);
  }, [petData?.id]);

  const handleAddPet = useCallback(() => {
    navigate(isAuthenticated ? "/dashboard/pets?action=add" : "/login?redirect=/dine");
  }, [isAuthenticated, navigate]);

  if (loading) return <PillarPageLayout pillar="dine" hideHero hideNavigation><LoadingState /></PillarPageLayout>;
  if (!petData) return <PillarPageLayout pillar="dine" hideHero hideNavigation><NoPetState onAddPet={handleAddPet} /></PillarPageLayout>;

  const activeDim = DINE_DIMS.find(d => d.id === openDim);

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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 8 }}>
              {DINE_DIMS.map(dim => (
                <div key={dim.id} onClick={() => setOpenDim(openDim === dim.id ? null : dim.id)} style={{ background: dim.bg, borderRadius: 12, padding: "14px 12px", cursor: "pointer", position: "relative", opacity: dim.glow ? 1 : 0.60, boxShadow: dim.glow && openDim !== dim.id ? "0 0 18px rgba(255,140,66,0.18)" : "none", border: openDim === dim.id ? "2px solid #FF8C42" : "2px solid transparent", transition: "all 0.15s" }} data-testid={`dine-dim-${dim.id}`}>
                  {dim.glow && <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: dim.dot }} />}
                  <span style={{ fontSize: 22, display: "block", marginBottom: 8 }}>{dim.icon}</span>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1A0A00", marginBottom: 3 }}>{dim.name}</div>
                  <div style={{ fontSize: 10, color: "#666", lineHeight: 1.3, marginBottom: 6 }}>{t(dim.sub, petData.name)}</div>
                  <span style={{ fontSize: 9, fontWeight: 700, borderRadius: 20, padding: "2px 7px", display: "inline-block", background: dim.badgeBg, color: dim.badgeCol }}>{t(dim.badge, petData.name)}</span>
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

            <MiraMealPick pet={petData} />
            <GuidedNutritionPaths pet={petData} />
          </>
        )}

        {activeTab === "out" && <PetFriendlySpots pet={petData} />}

        <DiningConcierge pet={petData} />
      </div>

      {/* Mira pill */}
      <div onClick={() => window.dispatchEvent(new CustomEvent("openMiraAI", { detail: { message: `What should ${petData.name} eat today?`, context: "dine" } }))} style={{ position: "fixed", bottom: 20, right: 20, background: "linear-gradient(135deg,#C44DFF,#FF2D87)", color: "#fff", borderRadius: 20, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, zIndex: 100, boxShadow: "0 4px 20px rgba(196,77,255,0.40)" }} data-testid="ask-mira-pill">
        ✦ Ask Mira
      </div>
    </PillarPageLayout>
  );
};

export default DineSoulPage;
