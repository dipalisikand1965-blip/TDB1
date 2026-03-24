/**
 * GuidedNutritionPaths.jsx
 * The Doggy Company — /dine page
 *
 * Full step-by-step guided flow for each nutrition path.
 * Mirrors Celebrate's birthday path architecture exactly.
 * Amber/terracotta colour world.
 *
 * 6 PATHS, each with 4 guided steps → Hand to Concierge
 * WIRING: POST /api/concierge/nutrition-path
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { getApiUrl } from "../../utils/api";
import { tdc } from "../../utils/tdc_intent";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function normaliseAllergies(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(a => a.trim().toLowerCase()).filter(Boolean);
  return String(raw).split(",").map(a => a.trim().toLowerCase()).filter(Boolean);
}

function capitalisedList(arr) {
  return arr.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(", ");
}

// ─────────────────────────────────────────────────────────────
// PATH DATA — built dynamically from pet soul profile
// ─────────────────────────────────────────────────────────────
function buildPaths(pet) {
  const allergies = normaliseAllergies(
    pet?.allergies || pet?.preferences?.allergies || pet?.doggy_soul_answers?.food_allergies
  );
  const name = pet?.name || "your pet";
  const firstAllergy = allergies[0] || "an allergen";
  const rawConditionRaw = pet?.healthCondition || pet?.health?.conditions?.[0] || pet?.doggy_soul_answers?.health_conditions || null;
  const rawCondition = Array.isArray(rawConditionRaw) ? rawConditionRaw[0] || null : rawConditionRaw;
  const condition = (rawCondition && typeof rawCondition === 'string' && rawCondition.toLowerCase() !== 'none' && rawCondition.toLowerCase() !== 'none_confirmed' && rawCondition.trim() !== '') ? rawCondition : null;
  const loves = ((pet?.favoriteFoods || pet?.preferences?.favorite_foods || []).filter(
    f => !allergies.includes(f.toLowerCase())
  )[0]) || "salmon";
  const lovesLabel = loves.charAt(0).toUpperCase() + loves.slice(1);

  return [
    // ── PATH 1: ALLERGY NAVIGATION ──────────────────────────
    {
      id: "allergy",
      icon: "🛡️",
      iconBg: "#FEF0F0",
      accentColor: "#C0392B",
      accentBg: "#FEF0F0",
      accentBorder: "#F5C6C6",
      badge: "Mira Pick",
      badgeBg: "#C0392B",
      photoBg: "linear-gradient(135deg,#FEF0F0,#FFD6D6)",
      title: "Allergy Navigation Path",
      desc: `Already know about ${allergies.length ? capitalisedList(allergies.slice(0,2)) : "potential allergens"}. Mira guides you to check for more — elimination, novel proteins, reintroduction.`,
      stepLabels: ["Identify allergens", "Find safe proteins", "Build safe food list", "Your plan"],
      miraNote: `${name}'s allergy profile is already loaded into every step. The safe proteins are filtered to match who ${name} actually is.`,
      step1: {
        title: "Identify known allergens",
        desc: `Mira has already noted ${name}'s allergies from their soul profile. Confirm and add any others.`,
        type: "confirm_allergies",
        confirmed: allergies,
        extras: ["Wheat / Gluten", "Dairy", "Eggs", "Beef", "Pork", "None of these"],
      },
      step2: {
        title: "Find safe proteins",
        desc: `${lovesLabel} is shown first — that's ${name}'s favourite. Everything here is ${allergies.length ? capitalisedList(allergies) + "-free" : "allergen-filtered"}.`,
        type: "select_one",
        miraPick: `${lovesLabel} (fresh)`,
        options: [
          { icon:"🐟", name:`${lovesLabel} (fresh)`, desc:`${name}'s favourite · ${allergies.length ? capitalisedList(allergies)+"-free" : "Safe"}`, mira:true },
          { icon:"🐑", name:"Lamb", desc:"Novel protein · Hypoallergenic", mira:false },
          { icon:"🦆", name:"Duck", desc:"Novel protein · Hypoallergenic", mira:false },
          { icon:"🐇", name:"Rabbit", desc:"Single-protein · Novel", mira:false },
        ],
      },
      step3: {
        title: "Build safe food list",
        desc: `Choose the ingredients Mira will use to build ${name}'s plan.`,
        type: "multi_select",
        options: [
          { icon:"🍠", name:"Sweet potato", desc:"Anti-inflammatory · Safe" },
          { icon:"🥦", name:"Broccoli", desc:"Antioxidant · Safe" },
          { icon:"🥕", name:"Carrots", desc:"Gut-friendly · Safe" },
          { icon:"🍚", name:"Brown rice", desc:"Digestible carb · Safe" },
          { icon:"🥜", name:"Peanut butter", desc:`${name} loves this · ${allergies.includes("peanut") ? "⚠️ Check allergy" : "Safe"}` },
          { icon:"🫐", name:"Blueberries", desc:"Antioxidant · Treat-safe" },
        ],
      },
      step4: {
        title: `${name}'s Allergy-Safe Plan`,
        summaryFields: ["Known allergens", "Safe protein", "Safe ingredients", "Next step"],
        cta: "🛡️ Hand to Concierge",
        conciergeNote: "Your Concierge will source allergy-safe products matching this plan.",
      },
    },

    // ── PATH 2: HEALTH NUTRITION ─────────────────────────────
    {
      id: "health",
      icon: "💜",
      iconBg: "#F0ECFF",
      accentColor: "#4B0082",
      accentBg: "#F0ECFF",
      accentBorder: "#C5AEFF",
      badge: "Mira Pick",
      badgeBg: "#4B0082",
      photoBg: "linear-gradient(135deg,#F0ECFF,#DDD0FF)",
      title: "Health Nutrition Path",
      desc: `Nutrition protocol tailored to ${name}'s ${condition || "health condition"} — joints, digestion, immunity, or more.`,
      stepLabels: ["Confirm condition", "Choose safe meals", "Supplement protocol", "Your plan"],
      miraNote: `${name}'s health condition is already loaded. Every recommendation here is treatment-safe and ${allergies.length ? capitalisedList(allergies)+"-free" : "allergen-filtered"}.`,
      step1: {
        title: "Confirm health condition",
        desc: `Mira has noted ${name}'s ${condition || "health profile"}. Confirm or update below.`,
        type: "confirm_condition",
        confirmed: condition || null,
        options: ["Lymphoma", "Sensitive stomach", "Joint issues", "Kidney support", "Post-surgery recovery", "Diabetes management", "Skin allergies", "Other"],
      },
      step2: {
        title: "Choose treatment-safe meals",
        desc: `Every meal here has been checked for ${name}'s condition. ${lovesLabel} is first — ${name}'s favourite.`,
        type: "select_one",
        miraPick: `${lovesLabel} & Sweet Potato (treatment-safe)`,
        options: [
          { icon:"🐟", name:`${lovesLabel} & Sweet Potato`, desc:`Treatment-safe · ${allergies.length ? capitalisedList(allergies)+"-free" : "Allergen-filtered"} · Omega-rich`, mira:true },
          { icon:"🐑", name:"Lamb & Vegetable Stew", desc:"Anti-inflammatory · Gentle digestion", mira:false },
          { icon:"🐠", name:"White Fish & Brown Rice", desc:"Low-fat · Kidney-gentle", mira:false },
          { icon:"🥗", name:"Vegetarian Protein Bowl", desc:"Plant-based · Anti-inflammatory", mira:false },
        ],
      },
      step3: {
        title: "Choose supplement protocol",
        desc: `Mira has ranked these for ${name}'s ${condition || "health condition"}. All vet-checked.`,
        type: "multi_select",
        options: [
          { icon:"🛡️", name:"Immunity Booster", desc:`Treatment-safe · Mira's pick for ${condition || "general health"}` },
          { icon:"🐟", name:"Salmon Oil (Omega 3)", desc:"Anti-inflammatory · Coat + joints" },
          { icon:"🌿", name:"Turmeric & Black Pepper", desc:"Natural anti-inflammatory · Safe" },
          { icon:"🌱", name:"Probiotic Powder", desc:"Gut health · Treatment-supportive" },
          { icon:"🍄", name:"Medicinal Mushroom", desc:`Turkey Tail — ${condition || "health"} research` },
        ],
      },
      step4: {
        title: `${name}'s Health Nutrition Plan`,
        summaryFields: ["Health condition", "Chosen meal", "Supplement protocol", "Next step"],
        cta: "💜 Hand to Concierge",
        conciergeNote: "Your Concierge will source treatment-safe products and coordinate with your vet.",
      },
    },

    // ── PATH 3: HOMEMADE COOKING ─────────────────────────────
    {
      id: "homemade",
      icon: "👩‍🍳",
      iconBg: "#FFF8E8",
      accentColor: "#C9973A",
      accentBg: "#FFF8E8",
      accentBorder: "#FFE5A0",
      badge: "Mira Pick",
      badgeBg: "#C9973A",
      photoBg: "linear-gradient(135deg,#FFF8E8,#FFE8B0)",
      title: "Homemade Cooking Path",
      desc: `Safe, balanced recipes you can make at home — allergy-filtered and vet-reviewed.`,
      stepLabels: ["Choose difficulty", "Pick safe ingredients", "Choose first recipe", "Your plan"],
      miraNote: `Every recipe here has had ${allergies.length ? capitalisedList(allergies) : "known allergens"} removed. ${lovesLabel} recipes are shown first because ${name} loves them.`,
      step1: {
        title: "Choose recipe difficulty",
        desc: `Mira will match the complexity to what works for you. All recipes are ${allergies.length ? capitalisedList(allergies)+"-free" : "allergen-filtered"}.`,
        type: "select_one",
        miraPick: "Quick & simple",
        options: [
          { icon:"⚡", name:"Quick & simple", desc:"Under 20 minutes · 5 ingredients max", mira:true },
          { icon:"🍳", name:"Weekend recipes", desc:"30–60 minutes · Batch-cook friendly", mira:false },
          { icon:"🎂", name:"Special occasion", desc:"Birthday cakes · Celebration treats", mira:false },
          { icon:"🧊", name:"Freeze-ahead", desc:"Make in bulk · Store for the week", mira:false },
        ],
      },
      step2: {
        title: "Pick safe ingredients",
        desc: `These are all ${allergies.length ? capitalisedList(allergies)+"-free" : "safe"}. ${lovesLabel} is at the top — ${name}'s favourite.`,
        type: "multi_select",
        options: [
          { icon:"🐟", name:lovesLabel, desc:`${name}'s favourite · Already confirmed safe` },
          { icon:"🥜", name:"Peanut butter", desc:"High-energy · Treat ingredient" },
          { icon:"🍠", name:"Sweet potato", desc:"Anti-inflammatory · Easy to cook" },
          { icon:"🥕", name:"Carrots", desc:"Crunchy treat · Gut-friendly" },
          { icon:"🍚", name:"Brown rice", desc:"Digestible carb · Filling" },
          { icon:"🫐", name:"Blueberries", desc:"Antioxidant · Safe garnish" },
        ],
      },
      step3: {
        title: "Choose your first recipe",
        desc: `${lovesLabel} recipes are first — Mira knows ${name} loves them.`,
        type: "select_one",
        miraPick: `${lovesLabel} & Sweet Potato Biscuits`,
        options: [
          { icon:"🍪", name:`${lovesLabel} & Sweet Potato Biscuits`, desc:`${name}'s favourite protein · 20 mins · Makes 24`, mira:true },
          { icon:"🧊", name:"Peanut Butter Frozen Treats", desc:"5 ingredients · Freeze-ahead", mira:false },
          { icon:"🎂", name:`${lovesLabel} Birthday Cake`, desc:"Special occasion · Full recipe with frosting", mira:false },
          { icon:"🍲", name:"Slow-Cooked Lamb Stew", desc:"Weekend recipe · 7 servings · Freeze in portions", mira:false },
        ],
      },
      step4: {
        title: `${name}'s Homemade Cooking Plan`,
        summaryFields: ["Difficulty level", "Safe ingredients", "First recipe", "Next step"],
        cta: "👩‍🍳 Hand to Concierge",
        conciergeNote: "Your Concierge will send ingredient guides and connect you with our vet-nutritionist.",
      },
    },

    // ── PATH 4: WEIGHT MANAGEMENT ────────────────────────────
    {
      id: "weight",
      icon: "⚖️",
      iconBg: "#E8F5E9",
      accentColor: "#2E7D32",
      accentBg: "#E8F5E9",
      accentBorder: "#A5D6A7",
      badge: "Mira Pick",
      badgeBg: "#2E7D32",
      photoBg: "linear-gradient(135deg,#E8F5E9,#C8E6C9)",
      title: "Weight Management Path",
      desc: `Structured weight loss or gain programme for ${name} — with nutritionist support and progress tracking.`,
      stepLabels: ["Set weight goal", "Choose a meal plan", "Build activity plan", "Your programme"],
      miraNote: `${name}'s current profile is already loaded. Every recommendation here is ${allergies.length ? capitalisedList(allergies)+"-free" : "allergen-filtered"} and sized for ${name}'s stage.`,
      step1: {
        title: `What is the weight goal for ${name}?`,
        desc: "Mira will build a plan around this. All recommendations filtered for health profile.",
        type: "select_one",
        miraPick: "Healthy weight maintenance",
        options: [
          { icon:"📉", name:"Gradual weight loss", desc:"Safe, sustainable — 5–10% body weight over 3 months", mira:false },
          { icon:"⚖️", name:"Healthy weight maintenance", desc:"Already at a good weight — keep it there", mira:true },
          { icon:"📈", name:"Healthy weight gain", desc:"Underweight — build muscle and body condition", mira:false },
          { icon:"💪", name:"Muscle conditioning", desc:"Build lean muscle without gaining fat", mira:false },
        ],
      },
      step2: {
        title: "Choose a weight-appropriate meal plan",
        desc: `Mira has ranked these for ${name}'s goal.`,
        type: "select_one",
        miraPick: `${lovesLabel} & Vegetable Bowl (portion-controlled)`,
        options: [
          { icon:"🐟", name:`${lovesLabel} & Vegetable Bowl`, desc:`Portion-controlled · High protein`, mira:true },
          { icon:"🥗", name:"Lean Protein & Greens", desc:"Low-calorie · High satiety · Vet-approved", mira:false },
          { icon:"🍠", name:"Complex Carb & Protein Mix", desc:"Slow-release energy · Balanced", mira:false },
          { icon:"🐑", name:"Lamb & Vegetable Light Bowl", desc:"Novel protein · Low-fat · Easy digestion", mira:false },
        ],
      },
      step3: {
        title: "Build an activity plan",
        desc: `Choose activities that complement ${name}'s weight goal.`,
        type: "multi_select",
        options: [
          { icon:"🚶", name:"Daily walks (30 min)", desc:"Foundational — builds base fitness" },
          { icon:"🏊", name:"Swimming sessions", desc:"Low-impact · Great for weight management" },
          { icon:"🎾", name:"Fetch & play", desc:"High-burn · Fun and engaging" },
          { icon:"🧘", name:"Doga (canine yoga)", desc:"Core strength · Flexibility" },
          { icon:"🏃", name:"Jogging intervals", desc:"Higher intensity · For fit dogs" },
        ],
      },
      step4: {
        title: `${name}'s Weight Management Programme`,
        summaryFields: ["Weight goal", "Chosen meal plan", "Activity plan", "Next step"],
        cta: "⚖️ Hand to Concierge",
        conciergeNote: "Your Concierge will coordinate with our nutritionist and set up a progress check schedule.",
      },
    },

    // ── PATH 5: SENIOR NUTRITION ─────────────────────────────
    {
      id: "senior",
      icon: "🌿",
      iconBg: "#E3F2FD",
      accentColor: "#1565C0",
      accentBg: "#E3F2FD",
      accentBorder: "#90CAF9",
      badge: "Mira Pick",
      badgeBg: "#1565C0",
      photoBg: "linear-gradient(135deg,#E3F2FD,#BBDEFB)",
      title: "Senior Nutrition Path",
      desc: `Specialised nutrition support for ${name}'s golden years — joint health, digestion, immunity, and vitality.`,
      stepLabels: ["Confirm senior needs", "Choose senior meals", "Choose supplements", "Your senior plan"],
      miraNote: `Senior dogs need different nutrition. Everything here is gentle, easy to digest, and filtered for ${name}'s allergies.`,
      step1: {
        title: `What does ${name} need most right now?`,
        desc: "Mira will prioritise recommendations based on your answer.",
        type: "multi_select",
        options: [
          { icon:"🦴", name:"Joint support", desc:"Arthritis, stiffness, mobility" },
          { icon:"🫀", name:"Heart health", desc:"Cardiac support and low-sodium options" },
          { icon:"🧠", name:"Cognitive support", desc:"Mental sharpness and alertness" },
          { icon:"🫁", name:"Digestive care", desc:"Sensitive stomach, easier digestion" },
          { icon:"🛡️", name:"Immune support", desc:"Antioxidants and immune boosters" },
          { icon:"⚡", name:"Energy and vitality", desc:"Counteract fatigue and lethargy" },
        ],
      },
      step2: {
        title: "Choose a senior-appropriate meal",
        desc: `Easy to digest, nutrient-dense, gentle on ageing systems.`,
        type: "select_one",
        miraPick: `${lovesLabel} & Sweet Potato Senior Bowl`,
        options: [
          { icon:"🐟", name:`${lovesLabel} & Sweet Potato Senior Bowl`, desc:`Omega-rich · Anti-inflammatory`, mira:true },
          { icon:"🐑", name:"Lamb & Lentil Senior Dinner", desc:"Easy protein · Gentle on digestion", mira:false },
          { icon:"🥕", name:"Vegetable & Egg Senior Mix", desc:"Light · Antioxidant-rich", mira:false },
          { icon:"🍲", name:"Slow-cooked Broth & Chicken", desc:"Hydrating · Soft texture for dental issues", mira:false },
        ],
      },
      step3: {
        title: "Choose senior supplements",
        desc: `Mira has ranked these for senior dogs. All vet-checked.`,
        type: "multi_select",
        options: [
          { icon:"🦴", name:"Glucosamine & Chondroitin", desc:"Joint support · Mobility · Cartilage" },
          { icon:"🐟", name:"Salmon Oil (Omega 3)", desc:"Anti-inflammatory · Coat · Heart" },
          { icon:"🌿", name:"Turmeric & Black Pepper", desc:"Natural anti-inflammatory" },
          { icon:"🌱", name:"Probiotic Powder", desc:"Gut health · Digestion support" },
          { icon:"🧪", name:"Vitamin E & Antioxidants", desc:"Cognitive support · Immune function" },
        ],
      },
      step4: {
        title: `${name}'s Senior Nutrition Plan`,
        summaryFields: ["Senior priorities", "Chosen meal", "Supplement stack", "Next step"],
        cta: "🌿 Hand to Concierge",
        conciergeNote: "Your Concierge will coordinate with our senior pet nutritionist and arrange delivery.",
      },
    },

    // ── PATH 6: PRESCRIPTION DIET ────────────────────────────
    {
      id: "prescription",
      icon: "💊",
      iconBg: "#F3E5F5",
      accentColor: "#6A1B9A",
      accentBg: "#F3E5F5",
      accentBorder: "#CE93D8",
      badge: "Mira Pick",
      badgeBg: "#6A1B9A",
      photoBg: "linear-gradient(135deg,#F3E5F5,#E1BEE7)",
      title: "Prescription Diet Path",
      desc: `Help sourcing and managing prescription diets for ${name}'s medical condition — coordinated with your vet.`,
      stepLabels: ["Confirm medical diet need", "Choose prescription food", "Coordinate with vet", "Your prescription plan"],
      miraNote: `Prescription diets require vet oversight. Mira has noted ${name}'s ${condition || "health condition"} and will only recommend options safe for their condition.`,
      step1: {
        title: `What medical diet does ${name} need?`,
        desc: "Mira will match prescription food options to your answer. All require vet sign-off.",
        type: "select_one",
        miraPick: condition ? `Diet for ${condition}` : "Hypoallergenic prescription diet",
        options: [
          { icon:"🫀", name:"Kidney / Renal diet", desc:"Low phosphorus, low protein, controlled minerals", mira:false },
          { icon:"🫁", name:"Gastrointestinal diet", desc:"Highly digestible, low-residue, gut-healing", mira:false },
          { icon:"🛡️", name:"Hypoallergenic prescription diet", desc:"Novel protein or hydrolysed — zero known allergens", mira:!condition },
          { icon:"💜", name:`Diet for ${condition || "lymphoma"}`, desc:"Oncology-safe, treatment-supportive, vet-approved", mira:!!condition },
          { icon:"⚖️", name:"Metabolic / weight prescription diet", desc:"Clinically formulated for obesity", mira:false },
          { icon:"🦷", name:"Dental prescription diet", desc:"Reduces tartar, supports oral health", mira:false },
        ],
      },
      step2: {
        title: "Choose a prescription food option",
        desc: `Mira has found options compatible with ${name}'s condition.`,
        type: "select_one",
        miraPick: `Royal Canin Veterinary — ${condition || "Hypoallergenic"}`,
        options: [
          { icon:"🏥", name:`Royal Canin Veterinary — ${condition || "Hypoallergenic"}`, desc:"Most prescribed · Available via vet · Clinically tested", mira:true },
          { icon:"🏥", name:"Hills Prescription Diet", desc:"Science Diet range · Vet-recommended", mira:false },
          { icon:"🌿", name:"Purina Pro Plan Veterinary", desc:"Research-backed · Multiple conditions covered", mira:false },
          { icon:"🍖", name:"Fresh prescription meal (home-cooked)", desc:"Vet-formulated recipe · Homemade with guidance", mira:false },
        ],
      },
      step3: {
        title: "Coordinate with your vet",
        desc: "Prescription diets need vet authorisation. Tell us about your vet so Mira can help coordinate.",
        type: "confirm_condition",
        confirmed: condition || null,
        options: [
          "I have a vet — please coordinate with them",
          "I need a vet referral first",
          "My vet has already recommended this diet",
          "I want a second opinion before starting",
        ],
      },
      step4: {
        title: `${name}'s Prescription Diet Plan`,
        summaryFields: ["Medical diet type", "Chosen food", "Vet coordination", "Next step"],
        cta: "💊 Hand to Concierge",
        conciergeNote: "Your Concierge will liaise with your vet, source the prescription food, and arrange delivery.",
      },
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// STEP INDICATOR
// ─────────────────────────────────────────────────────────────
function StepIndicator({ steps, currentStep, completedSteps, accentColor }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, marginBottom:24 }}>
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isComplete = completedSteps.includes(stepNum);
        const isCurrent = currentStep === stepNum;
        const isPending = !isComplete && !isCurrent;
        return (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
              <div style={{
                width:32, height:32, borderRadius:"50%",
                background: isComplete ? accentColor : isCurrent ? accentColor : "#E0D8D0",
                color: (isComplete || isCurrent) ? "#fff" : "#999",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize: isComplete ? 14 : 13, fontWeight:700,
                transition:"all 0.2s",
              }}>
                {isComplete ? "✓" : stepNum}
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width:2, height:28,
                  background: isComplete ? accentColor : "#E0D8D0",
                  transition:"background 0.3s",
                }} />
              )}
            </div>
            <div style={{
              paddingTop:6, paddingBottom: i < steps.length - 1 ? 28 : 0,
              fontSize:14, fontWeight: isCurrent ? 700 : 400,
              color: isPending ? "#BBB" : "#1A0A00",
            }}>
              {label}
              {isComplete && (
                <span style={{
                  marginLeft:10, fontSize:11, fontWeight:600,
                  color: accentColor, background:`${accentColor}18`,
                  borderRadius:20, padding:"1px 8px",
                }}>✓ Done</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OPTION ROW
// ─────────────────────────────────────────────────────────────
function OptionRow({ option, selected, onSelect, accentColor }) {
  return (
    <div
      onClick={() => onSelect(option.name)}
      style={{
        background: selected ? `${accentColor}10` : "#fff",
        border:`1.5px solid ${selected ? accentColor : "#F0E8E0"}`,
        borderRadius:12, padding:"12px 16px",
        display:"flex", alignItems:"center", gap:12,
        cursor:"pointer", transition:"all 0.12s",
        marginBottom:6,
      }}
    >
      {option.icon && <span style={{ fontSize:24, flexShrink:0 }}>{option.icon}</span>}
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
          <span style={{ fontSize:14, fontWeight:700, color:"#1A0A00" }}>{option.name}</span>
          {option.mira && (
            <span style={{
              background:`${accentColor}18`, color:accentColor,
              fontSize:10, fontWeight:700, borderRadius:20, padding:"1px 7px",
            }}>★ Mira's pick</span>
          )}
        </div>
        <div style={{ fontSize:12, color:"#888" }}>{option.desc}</div>
      </div>
      {selected && (
        <div style={{
          width:22, height:22, borderRadius:"50%", background:accentColor,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#fff", fontSize:12, fontWeight:700, flexShrink:0,
        }}>✓</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STEP PANEL
// ─────────────────────────────────────────────────────────────
function StepPanel({ title, desc, accentColor, children }) {
  return (
    <div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{title}</div>
        <div style={{ fontSize:13, color:"#888", lineHeight:1.55 }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL SHELL — uses createPortal to escape stacking contexts
// ─────────────────────────────────────────────────────────────
function ModalShell({ onClose, children, noPadding }) {
  return createPortal(
    <div
      style={{
        position:"fixed", inset:0, zIndex:10002,
        background:"rgba(0,0,0,0.50)",
        display:"flex", alignItems:"center",
        justifyContent:"center", padding:20,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#fff",
          borderRadius:20,
          width:"min(720px,100%)",
          maxHeight:"90vh",
          overflowY:"auto",
          boxShadow:"0 24px 80px rgba(0,0,0,0.20)",
          padding: noPadding ? 0 : "28px 28px 24px",
          border:`2px solid #F0E8E0`,
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────
// PATH FLOW MODAL — the full guided experience
// ─────────────────────────────────────────────────────────────
function PathFlowModal({ path, pet, onClose }) {
  const [currentStep,    setCurrentStep]    = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selections,     setSelections]     = useState({ step1:[], step2:null, step3:[], step4:null });
  const [submitted,      setSubmitted]      = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const allergies = normaliseAllergies(pet?.allergies || pet?.preferences?.allergies);

  const totalSteps = 4;

  const completeStep = (step) => {
    if (!completedSteps.includes(step)) setCompletedSteps(prev => [...prev, step]);
    if (step < totalSteps) setCurrentStep(step + 1);
  };

  const handleSelect1 = (val) => {
    if (path.step1.type === "confirm_allergies") {
      setSelections(prev => {
        const cur = prev.step1;
        return { ...prev, step1: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
      });
    } else {
      setSelections(prev => ({ ...prev, step1: prev.step1 === val ? [] : [val] }));
    }
  };

  const handleSelect2 = (val) => setSelections(prev => ({ ...prev, step2: val }));

  const handleSelect3 = (val) => {
    setSelections(prev => {
      const cur = prev.step3;
      if (path.step3.type === "select_one") return { ...prev, step3: [val] };
      return { ...prev, step3: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // Fire tdc.request on nutrition path completion
    tdc.request({ text: `Completed guided nutrition path: ${path.title}`, name: path.title, pillar: "dine", pet, channel: "dine_guided_paths_complete" });
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/concierge/nutrition-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petId: pet?.id,
          petName: pet?.name,
          pathId: path.id,
          pathTitle: path.title,
          selections,
        }),
      });
    } catch (err) {
      console.error("[GuidedNutritionPaths]", err);
    } finally {
      setSubmitting(false);
      setSubmitted(true);
      toast.success(`${path.title.replace(" Path","")} sent to Concierge`, { description: "We'll reach out within 48 hours." });
    }
  };

  // ── SUBMITTED ───────────────────────────────────────────────
  if (submitted) {
    return (
      <ModalShell onClose={onClose} noPadding>
        <div style={{
          background:"linear-gradient(135deg,#0E0500,#1A0800)",
          borderRadius:20, padding:"48px 40px",
          textAlign:"center", minHeight:320,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
        }}>
          <div style={{
            width:64, height:64, borderRadius:"50%",
            background:`linear-gradient(135deg,${path.accentColor},#FF8C42)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:28, marginBottom:20,
          }}>♥</div>
          <div style={{ fontSize:22, fontWeight:800, color:"#FFFFFF", fontFamily:"Georgia,serif", marginBottom:10 }}>
            {path.title.replace(" Path","")} sent to your Concierge.
          </div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.55)", marginBottom:28, lineHeight:1.6 }}>
            Everything is in good hands.<br/>Your Concierge will reach out within 48 hours. ♥
          </div>
          <button
            onClick={onClose}
            style={{
              background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.20)",
              color:"#fff", borderRadius:20, padding:"10px 24px", fontSize:13, fontWeight:600, cursor:"pointer",
            }}
          >Close</button>
        </div>
      </ModalShell>
    );
  }

  // ── PLAN SUMMARY (step 4) ───────────────────────────────────
  if (currentStep === 4 && completedSteps.includes(3)) {
    const summaryData = {
      [path.step4.summaryFields[0]]: path.id === "allergy"
        ? capitalisedList([...allergies, ...selections.step1.filter(s => !allergies.map(a => a.toLowerCase()).includes(s.toLowerCase()))])
        : (selections.step1[0] || pet?.healthCondition || "Not specified"),
      [path.step4.summaryFields[1]]: selections.step2 || "Not selected",
      [path.step4.summaryFields[2]]: Array.isArray(selections.step3) ? selections.step3.join(", ") || "Not selected" : (selections.step3 || "Not selected"),
      [path.step4.summaryFields[3]]: "Concierge will contact within 48h",
    };

    return (
      <ModalShell onClose={onClose}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <span style={{ fontSize:28 }}>{path.icon}</span>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:"#1A0A00", fontFamily:"Georgia,serif" }}>{path.step4.title}</div>
            <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{path.step4.summaryFields.join(" · ")}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:"auto", background:"#F5F5F5", border:"none", borderRadius:"50%", width:32, height:32, fontSize:16, cursor:"pointer", color:"#555" }}>✕</button>
        </div>
        <div style={{ background:"#fff", border:"1px solid #F0E8E0", borderRadius:14, marginBottom:20, overflow:"hidden" }}>
          {Object.entries(summaryData).map(([key, val], i, arr) => (
            <div key={key} style={{ display:"flex", alignItems:"flex-start", padding:"14px 18px", borderBottom: i < arr.length-1 ? "1px solid #F5F0EA" : "none" }}>
              <div style={{ fontSize:13, fontWeight:700, color:path.accentColor, width:140, flexShrink:0 }}>{key}</div>
              <div style={{ fontSize:13, color:"#1A0A00", flex:1, lineHeight:1.5 }}>{val}</div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          data-testid="nutrition-path-submit-btn"
          style={{
            width:"100%",
            background:`linear-gradient(135deg,${path.accentColor},#FF8C42)`,
            color:"#fff", border:"none", borderRadius:14,
            padding:"16px", fontSize:16, fontWeight:800,
            cursor:"pointer", marginBottom:10,
            opacity: submitting ? 0.75 : 1,
          }}
        >
          {submitting ? "Sending…" : path.step4.cta}
        </button>
        <div style={{ fontSize:12, color:"#888", textAlign:"center" }}>{path.step4.conciergeNote}</div>
      </ModalShell>
    );
  }

  // ── MAIN STEP FLOW ──────────────────────────────────────────
  return (
    <ModalShell onClose={onClose}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{path.icon}</div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:"#1A0A00", fontFamily:"Georgia,serif" }}>{path.title.replace(" Path", ` for ${pet?.name || "your pet"}`)}</div>
            <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{totalSteps} steps. One complete nutrition plan.</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background:"#F5F5F5", border:"none", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:600, color:"#555", cursor:"pointer" }}>Close</button>
      </div>

      {/* Mira knows banner */}
      <div style={{
        background:`${path.accentColor}12`, border:`1px solid ${path.accentColor}30`,
        borderRadius:12, padding:"12px 16px",
        display:"flex", alignItems:"flex-start", gap:10, marginBottom:22,
      }}>
        <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,${path.accentColor},#FF8C42)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0 }}>✦</div>
        <div>
          <div style={{ fontSize:13, color:"#5A2800", fontStyle:"italic", lineHeight:1.55 }}>{path.miraNote}</div>
          <div style={{ fontSize:11, color:path.accentColor, fontWeight:600, marginTop:3 }}>♥ Mira knows {pet?.name || "your pet"}</div>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator steps={path.stepLabels} currentStep={currentStep} completedSteps={completedSteps} accentColor={path.accentColor} />

      {/* ── STEP 1 ── */}
      {currentStep === 1 && (
        <StepPanel stepNum={1} title={path.step1.title} desc={path.step1.desc} accentColor={path.accentColor}>
          {path.step1.type === "confirm_allergies" && (
            <div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8 }}>From {pet?.name}'s soul profile</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {(path.step1.confirmed || []).map(a => (
                    <span key={a} style={{ background:"#FEF0F0", border:"1px solid #F5C6C6", borderRadius:20, padding:"4px 12px", fontSize:13, color:"#C0392B", fontWeight:600 }}>
                      ⚠️ {a.charAt(0).toUpperCase()+a.slice(1)}
                    </span>
                  ))}
                  {!(path.step1.confirmed?.length) && <span style={{ fontSize:12, color:"#888" }}>No confirmed allergies yet</span>}
                </div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8, marginTop:14 }}>Any others?</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
                {(path.step1.extras || []).map(extra => {
                  const sel = selections.step1.includes(extra);
                  return (
                    <button key={extra} onClick={() => handleSelect1(extra)} style={{ background: sel ? `${path.accentColor}15` : "#fff", border:`1.5px solid ${sel ? path.accentColor : "#F0E8E0"}`, borderRadius:20, padding:"5px 14px", fontSize:12, color: sel ? path.accentColor : "#555", fontWeight: sel ? 600 : 400, cursor:"pointer", transition:"all 0.12s" }}>
                      {sel ? "✓ " : ""}{extra}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => completeStep(1)} style={{ background:`linear-gradient(135deg,${path.accentColor},#FF8C42)`, color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Confirm allergens →</button>
            </div>
          )}
          {(path.step1.type === "confirm_condition" || path.step1.type === "select_one") && (
            <div>
              {path.step1.type === "confirm_condition" && pet?.healthCondition && (
                <div style={{ background:"#FFF3E0", border:"1px solid #FFCC99", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#8B4500" }}>
                  ✦ From {pet.name}'s soul profile: <strong>{pet.healthCondition}</strong>
                </div>
              )}
              {(path.step1.options || []).map(opt => {
                // confirm_condition options are strings; select_one options are objects
                const isStr = typeof opt === "string";
                const optObj = isStr ? { name: opt, icon: null, desc: "", mira: opt === pet?.healthCondition } : opt;
                return (
                  <OptionRow key={optObj.name} option={optObj} selected={selections.step1.includes(optObj.name)} onSelect={handleSelect1} accentColor={path.accentColor} />
                );
              })}
              <button onClick={() => completeStep(1)} style={{ marginTop:8, background:`linear-gradient(135deg,${path.accentColor},#FF8C42)`, color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Confirm →</button>
            </div>
          )}
          {path.step1.type === "multi_select" && (
            <div>
              {(path.step1.options || []).map(opt => (
                <OptionRow key={opt.name} option={opt} selected={selections.step1.includes(opt.name)} onSelect={handleSelect1} accentColor={path.accentColor} multi />
              ))}
              <button onClick={() => selections.step1.length > 0 && completeStep(1)} style={{ marginTop:8, background: selections.step1.length > 0 ? `linear-gradient(135deg,${path.accentColor},#FF8C42)` : "#E0D8D0", color: selections.step1.length > 0 ? "#fff" : "#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor: selections.step1.length > 0 ? "pointer" : "not-allowed", transition:"all 0.15s" }}>Confirm →</button>
            </div>
          )}
        </StepPanel>
      )}

      {/* ── STEP 2 ── */}
      {currentStep === 2 && (
        <StepPanel stepNum={2} title={path.step2.title} desc={path.step2.desc} accentColor={path.accentColor}>
          {(path.step2.options || []).map(opt => (
            <OptionRow key={opt.name} option={opt} selected={selections.step2 === opt.name} onSelect={handleSelect2} accentColor={path.accentColor} />
          ))}
          <button onClick={() => selections.step2 && completeStep(2)} style={{ marginTop:8, background: selections.step2 ? `linear-gradient(135deg,${path.accentColor},#FF8C42)` : "#E0D8D0", color: selections.step2 ? "#fff" : "#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor: selections.step2 ? "pointer" : "not-allowed", transition:"all 0.15s" }}>Confirm →</button>
        </StepPanel>
      )}

      {/* ── STEP 3 ── */}
      {currentStep === 3 && (
        <StepPanel stepNum={3} title={path.step3.title} desc={path.step3.desc} accentColor={path.accentColor}>
          {(path.step3.options || []).map(opt => {
            const isStr = typeof opt === "string";
            const optObj = isStr ? { name: opt, icon: null, desc: "", mira: false } : opt;
            return (
              <OptionRow key={optObj.name} option={optObj} selected={selections.step3.includes(optObj.name)} onSelect={handleSelect3} accentColor={path.accentColor} multi={path.step3.type === "multi_select"} />
            );
          })}
          <button onClick={() => selections.step3.length > 0 && completeStep(3)} style={{ marginTop:8, background: selections.step3.length > 0 ? `linear-gradient(135deg,${path.accentColor},#FF8C42)` : "#E0D8D0", color: selections.step3.length > 0 ? "#fff" : "#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor: selections.step3.length > 0 ? "pointer" : "not-allowed", transition:"all 0.15s" }}>See {pet?.name}'s Plan →</button>
        </StepPanel>
      )}
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT — 3-column grid, identical layout to CelebratePaths
// ─────────────────────────────────────────────────────────────
export default function GuidedNutritionPaths({ pet }) {
  const [activePath, setActivePath] = useState(null);
  const allPaths    = buildPaths(pet);
  const petName     = pet?.name || "your pet";

  const openModal  = (pathId, pathObj) => {
    if (pathObj) tdc.request({ text: `Started guided nutrition path: ${pathObj.title}`, name: pathObj.title, pillar: "dine", pet, channel: "dine_guided_paths_start" });
    setActivePath(pathId);
  };
  const closeModal = () => setActivePath(null);

  return (
    <section style={{ padding: "0 0 48px" }} data-testid="guided-nutrition-paths">

      {/* Full guided flow modal */}
      {activePath && (
        <PathFlowModal
          path={allPaths.find(p => p.id === activePath)}
          pet={pet}
          onClose={closeModal}
        />
      )}

      {/* Section Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontSize: "clamp(1.3rem,5vw,2rem)",
          fontWeight: 800, color: "#1A0A00",
          fontFamily: "Georgia, serif",
          marginBottom: 6, lineHeight: 1.2,
        }}>
          Guided Nutrition Paths
        </h2>
        <p style={{ fontSize: 14, color: "#666", marginTop: 6, lineHeight: 1.5 }}>
          Mira walks you through every step. Each path ends with a plan you can keep.
        </p>
      </div>

      {/* 3-column grid — matches guided-paths-grid CSS */}
      <style>{`
        .guided-paths-grid {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 767px) {
          .guided-paths-grid {
            grid-template-columns: repeat(1, 1fr);
          }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .guided-paths-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
      <div style={{ display: "grid", gap: 16 }} className="guided-paths-grid">
        {allPaths.map(path => (
          <NutritionPathCard
            key={path.id}
            path={path}
            petName={petName}
            onOpen={() => openModal(path.id, path)}
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// NUTRITION PATH CARD — mirrors GuidedPathCard.jsx from Celebrate
// ─────────────────────────────────────────────────────────────
function NutritionPathCard({ path, petName, onOpen }) {
  const [hovered, setHovered] = useState(false);

  const visibleSteps = path.stepLabels.slice(0, 3);
  const hiddenCount  = path.stepLabels.length - 3;

  // Derive alpha variants from accentColor
  const alpha = (hex, pct) => {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${pct})`;
  };
  const a12 = alpha(path.accentColor, 0.12);
  const a15 = alpha(path.accentColor, 0.15);
  const a20 = alpha(path.accentColor, 0.20);
  const a50 = alpha(path.accentColor, 0.50);

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onOpen()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 20,
        padding: 24,
        cursor: "pointer",
        background: path.accentBg,
        border: `2px solid ${hovered ? path.accentColor : "transparent"}`,
        boxShadow: hovered ? `0 8px 24px ${a12}` : "none",
        transform: hovered ? "translateY(-3px)" : "none",
        transition: "transform 200ms ease, box-shadow 200ms ease, border 200ms ease",
        minHeight: 220,
      }}
      data-testid={`nutrition-path-${path.id}`}
      className="guided-path-card"
    >
      {/* Icon box */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, background: a20, marginBottom: 16,
      }}>
        {path.icon}
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1A0A00", marginBottom: 8 }}>
        {path.title}
      </h3>

      {/* Description */}
      <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 16, minHeight: 60 }}>
        {path.desc}
      </p>

      {/* Step chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
        {visibleSteps.map((step, i) => (
          <span key={i} style={{
            borderRadius: 9999, padding: "4px 12px",
            fontSize: 12, fontWeight: 500,
            background: a15, color: path.accentColor,
          }}>
            {step}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span style={{
            borderRadius: 9999, padding: "4px 12px",
            fontSize: 12, fontWeight: 700,
            background: a15, color: path.accentColor,
          }}>
            +{hiddenCount} more
          </span>
        )}
      </div>

      {/* Mira badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        background: a15, borderRadius: 9999, padding: "3px 10px",
      }}>
        <span style={{ fontSize: 10, color: path.accentColor }}>★</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: path.accentColor }}>Mira Pick</span>
      </div>

      {/* Chevron */}
      <span style={{
        position: "absolute", bottom: 18, right: 20,
        fontSize: 20,
        color: hovered ? path.accentColor : a50,
        transition: "color 200ms ease",
        userSelect: "none",
      }}>
        ›
      </span>
    </div>
  );
}
