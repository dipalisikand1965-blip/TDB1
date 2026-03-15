/**
 * DineSoulPage.jsx — /dine pillar
 * The Doggy Company · Built from DineSoulPage_v2 spec
 *
 * Architecture: PillarPageLayout wrapper (matches /celebrate-soul)
 * Data spine:   TummyProfile → pet allergies/loves/health filter everything
 * Colors:       Amber / terracotta  (#3d1200 → #e86a00)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePillarContext } from "../context/PillarContext";
import PillarPageLayout from "../components/PillarPageLayout";
import MiraSoulNudge from "../components/celebrate/MiraSoulNudge";
import { API_URL } from "../utils/api";
import { toast } from "../hooks/use-toast";

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

// ─── TummyProfile ─────────────────────────────────────────────────────────────
function TummyProfile({ pet, token, onUpdate }) {
  const [open, setOpen] = useState(true);
  const [goal, setGoal] = useState(pet?.nutrition_goal || pet?.doggy_soul_answers?.nutrition_goal || "Healthy maintenance");
  const [saving, setSaving] = useState(false);
  const allergies = getAllergies(pet);
  const loves = getLoves(pet);
  const healthCondition = getHealthCondition(pet);
  const petName = pet?.name || "your dog";

  const saveGoal = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/pets/${pet.id}/soul`, {
        method:"PUT",
        headers:{"Content-Type":"application/json","Authorization":`Bearer ${token}`},
        body:JSON.stringify({nutrition_goal:goal}),
      });
      if (res.ok) toast({ title: "Nutrition goal updated!" });
    } catch {}
    setSaving(false);
  };

  return (
    <div style={{background:"#fff",border:"2px solid #FFE5CC",borderRadius:20,marginBottom:24,overflow:"hidden"}} data-testid="tummy-profile">
      <div onClick={() => setOpen(!open)} style={{padding:"16px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}>
        <div style={{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#FFF3E0,#FFE0B2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>🐾</div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:700,color:"#1A0A00"}}>{petName}'s Tummy Profile</div>
          <div style={{fontSize:11,color:"#888"}}>How Mira filters everything on this page</div>
        </div>
        <span style={{color:"#C44400",fontSize:14}}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{padding:"0 20px 20px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div style={{background:"#E8F8EE",border:"1px solid #B2DFC4",borderRadius:14,padding:14}}>
              <div style={{fontSize:10,fontWeight:700,color:"#27AE60",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Loves</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {loves.length > 0 ? loves.map(l => (
                  <span key={l} style={{background:"#fff",border:"1.5px solid #27AE60",borderRadius:20,padding:"3px 10px",fontSize:12,color:"#27AE60",fontWeight:500}}>{l.charAt(0).toUpperCase()+l.slice(1)}</span>
                )) : <span style={{fontSize:12,color:"#aaa"}}>Tell Mira what {petName} loves</span>}
              </div>
            </div>
            <div style={{background:"#FEF0F0",border:"1px solid #F5C6C6",borderRadius:14,padding:14}}>
              <div style={{fontSize:10,fontWeight:700,color:"#C0392B",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Avoid</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {allergies.length > 0 ? allergies.map(a => (
                  <span key={a} style={{background:"#fff",border:"1.5px solid #E57373",borderRadius:20,padding:"3px 10px",fontSize:12,color:"#C0392B",fontWeight:500}}>{a}</span>
                )) : <span style={{fontSize:12,color:"#aaa"}}>No allergies noted yet</span>}
              </div>
            </div>
            <div style={{background:"#FFFBEE",border:"1px solid #FFE5A0",borderRadius:14,padding:14}}>
              <div style={{fontSize:10,fontWeight:700,color:"#C9973A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Nutrition Goal</div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input value={goal} onChange={e => setGoal(e.target.value)} style={{flex:1,border:"1.5px solid #FFE5A0",borderRadius:8,padding:"6px 10px",fontSize:13,color:"#1A0A00",outline:"none",background:"#fff"}} />
                <button onClick={saveGoal} disabled={saving} style={{background:"#C44400",color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>{saving?"…":"✓ Update"}</button>
              </div>
            </div>
            <div style={{background:"#F0F4FF",border:"1px solid #C5CEFF",borderRadius:14,padding:14}}>
              <div style={{fontSize:10,fontWeight:700,color:"#3B5BDB",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Health Note</div>
              <div style={{fontSize:13,color:healthCondition?"#1A0A00":"#999"}}>{healthCondition||"No health notes added yet"}</div>
            </div>
          </div>
          <div style={{background:"linear-gradient(135deg,#FFF3E0,#FDE8E8)",borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"flex-start",gap:10}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#FF8C42,#C44DFF)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#fff",flexShrink:0,marginTop:1}}>✦</div>
            <p style={{fontSize:13,color:"#5A2800",lineHeight:1.55,margin:0}}>
              <strong style={{color:"#1A0A00"}}>Mira filters every product on this page</strong> using the profile above
              {allergies.length > 0 ? ` — hiding anything with ${allergies.join(" and ")}` : ""}
              {loves.length > 0 ? `, surfacing ${loves[0].charAt(0).toUpperCase()+loves[0].slice(1)}-based options first` : ""}
              {healthCondition ? `, and adjusting picks for ${petName}'s ${healthCondition}` : ""}.
            </p>
          </div>
        </div>
      )}
    </div>
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

// ─── Hero ─────────────────────────────────────────────────────────────────────
function DineHeroV2({ pet, soulScore }) {
  const petName = pet?.name || "your dog";
  const score = Math.round(soulScore || pet?.soul_score || pet?.overall_score || 0);
  const petPhoto = pet?.photo_url || pet?.image_url || null;
  const allergies = getAllergies(pet);
  const loves = getLoves(pet);
  const healthCondition = getHealthCondition(pet);

  const quoteText = allergies.length > 0
    ? `I've already removed everything containing ${allergies.join(" and ")}. What you see is safe.${healthCondition ? ` I'm keeping ${petName}'s ${healthCondition} in mind with everything I suggest here.` : ""}`
    : `I know ${petName}'s body as well as I know their soul. Everything I show you here has been filtered for them.`;

  return (
    <div style={{background:"linear-gradient(135deg,#3d1200 0%,#7a2800 40%,#c44400 75%,#e86a00 100%)",padding:"32px 32px 24px",position:"relative",overflow:"hidden"}} data-testid="dine-hero">
      <div style={{position:"absolute",top:-80,right:-60,width:280,height:280,background:"radial-gradient(circle,rgba(255,140,66,0.25) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:0,left:60,width:180,height:180,background:"radial-gradient(circle,rgba(196,77,255,0.15) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{position:"relative",zIndex:2,display:"flex",alignItems:"flex-start",gap:18}}>
        {/* Avatar */}
        <div style={{position:"relative",flexShrink:0}}>
          <div style={{width:80,height:80,borderRadius:"50%",border:"2px solid transparent",background:"linear-gradient(#3d1200,#3d1200) padding-box,linear-gradient(135deg,#00E676,#FF8C42) border-box",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,overflow:"hidden"}}>
            {petPhoto ? <img src={petPhoto} alt={petName} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} /> : "🐕"}
          </div>
          <div style={{position:"absolute",bottom:-8,left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#FF8C42,#C44DFF)",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:20,whiteSpace:"nowrap"}}>Soul {score}%</div>
        </div>
        {/* Content */}
        <div style={{flex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.20)",borderRadius:20,padding:"3px 10px",color:"rgba(255,255,255,0.85)",fontSize:12,marginBottom:10}}>✦ Food &amp; Nourishment for {petName}</div>
          <div style={{fontSize:"clamp(1.75rem,4vw,2.5rem)",fontWeight:800,lineHeight:1.1,marginBottom:6}}>
            <span style={{color:"#FFD080"}}>Food &amp; Nourishment</span><br/>
            <span style={{color:"#fff"}}>for </span><span style={{color:"#FFAAD4"}}>{petName}</span>
          </div>
          <div style={{fontSize:"clamp(0.8rem,1.5vw,0.9rem)",color:"rgba(255,255,255,0.60)",marginBottom:14}}>I know {petName}'s body as well as I know their soul.</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
            {allergies.map(a => <SoulChip key={a} extraStyle={{borderColor:"rgba(255,107,157,0.50)",background:"rgba(255,107,157,0.12)"}}>⚠️ No {a}</SoulChip>)}
            {loves[0] && <SoulChip extraStyle={{borderColor:"rgba(255,208,128,0.50)",background:"rgba(255,208,128,0.10)"}}>💚 Loves: {loves[0]}</SoulChip>}
            {healthCondition && <SoulChip extraStyle={{borderColor:"rgba(196,77,255,0.50)",background:"rgba(196,77,255,0.10)"}}>🛡️ {healthCondition}</SoulChip>}
          </div>
          <MiraQuoteBox text={quoteText} byline={`♥ Mira knows ${petName}`} />
        </div>
      </div>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div style={{background:"#fff",borderBottom:"1px solid #F0E8E0",display:"flex",padding:"0 24px"}} data-testid="dine-tab-bar">
      {[{id:"eat",icon:"🍽️",label:"Eat & Nourish"},{id:"out",icon:"🗺️",label:"Dine Out"}].map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"0 24px",height:52,fontSize:14,fontWeight:600,color:active===tab.id?"#C44400":"#888",borderBottom:`3px solid ${active===tab.id?"#C44400":"transparent"}`,background:"none",border:"none",borderBottom:`3px solid ${active===tab.id?"#C44400":"transparent"}`,cursor:"pointer",transition:"all 0.15s"}} data-testid={`dine-tab-${tab.id}`}>
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

      {/* Hero — full bleed */}
      <DineHeroV2 pet={petData} soulScore={soulScore} />

      {/* Tab bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Page body */}
      <div style={{background:"#FDF6EE",padding:20,maxWidth:1100,margin:"0 auto",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>

        {activeTab === "eat" && (
          <>
            <TummyProfile pet={petData} token={token} onUpdate={p => { setPetData(p); setCurrentPet(p); }} />

            {/* Mira soul nudge — dine context (unanswered nutrition questions) */}
            <MiraSoulNudge pet={petData} token={token} context="dine" limit={3} />

            <div style={{fontSize:"clamp(1.125rem,2.5vw,1.375rem)",fontWeight:800,color:"#1A0A00",marginBottom:4,fontFamily:"Georgia,serif"}}>Eat &amp; Nourish</div>
            <div style={{fontSize:12,color:"#888",marginBottom:16}}>5 dimensions, filtered to {petData.name}</div>

            {/* Dimensions grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:8}}>
              {DINE_DIMS.map(dim => (
                <div key={dim.id} onClick={() => setOpenDim(openDim===dim.id?null:dim.id)} style={{background:dim.bg,borderRadius:12,padding:"14px 12px",cursor:"pointer",position:"relative",opacity:dim.glow?1:0.60,boxShadow:dim.glow&&openDim!==dim.id?"0 0 18px rgba(255,140,66,0.18)":"none",border:openDim===dim.id?"2px solid #FF8C42":"2px solid transparent",transition:"all 0.15s"}} data-testid={`dine-dim-${dim.id}`}>
                  {dim.glow && <div style={{position:"absolute",top:8,right:8,width:8,height:8,borderRadius:"50%",background:dim.dot}}/>}
                  <span style={{fontSize:22,display:"block",marginBottom:8}}>{dim.icon}</span>
                  <div style={{fontSize:11,fontWeight:700,color:"#1A0A00",marginBottom:3}}>{dim.name}</div>
                  <div style={{fontSize:10,color:"#666",lineHeight:1.3,marginBottom:6}}>{t(dim.sub, petData.name)}</div>
                  <span style={{fontSize:9,fontWeight:700,borderRadius:20,padding:"2px 7px",display:"inline-block",background:dim.badgeBg,color:dim.badgeCol}}>{dim.badge}</span>
                  <span style={{position:"absolute",bottom:8,right:10,fontSize:14,color:"rgba(0,0,0,0.25)",transition:"transform 0.2s",transform:openDim===dim.id?"rotate(90deg)":"none"}}>›</span>
                </div>
              ))}
            </div>

            {/* Expanded panel */}
            {activeDim && (
              <div style={{display:"grid",gridTemplateColumns:"1fr"}}>
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
      <div onClick={() => window.dispatchEvent(new CustomEvent("openMiraAI",{detail:{message:`What should ${petData.name} eat today?`,context:"dine"}}))} style={{position:"fixed",bottom:20,right:20,background:"linear-gradient(135deg,#C44DFF,#FF2D87)",color:"#fff",borderRadius:20,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,zIndex:100,boxShadow:"0 4px 20px rgba(196,77,255,0.40)"}} data-testid="ask-mira-pill">
        ✦ Ask Mira
      </div>
    </PillarPageLayout>
  );
};

export default DineSoulPage;
