/**
 * GuidedCarePaths.jsx
 * The Doggy Company — /care page
 *
 * Full step-by-step guided flow for each care path.
 * Mirrors GuidedNutritionPaths.jsx architecture exactly.
 * Sage green colour world.
 *
 * 6 PATHS:
 * PATH 1 — Grooming Path          (Rose)
 * PATH 2 — Dental Health Path     (Teal)
 * PATH 3 — Senior Care Path       (Blue)
 * PATH 4 — Post-Surgery Recovery  (Purple)
 * PATH 5 — Anxiety & Behaviour    (Amber)
 * PATH 6 — Preventive Wellness    (Sage)
 *
 * HOW TO USE:
 *   import GuidedCarePaths from "./GuidedCarePaths";
 *   <GuidedCarePaths pet={pet} />
 *
 * WIRING:
 *   POST /api/concierge/care-path
 *   body: { petId, pathId, selections }
 */

import { useState, useEffect } from "react";
import { guidedPathComplete } from "../../utils/MiraCardActions";
import { tdc } from "../../utils/tdc_intent";
import { useConcierge } from "../../hooks/useConcierge";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function capitalisedList(arr) {
  if (!arr || arr.length === 0) return "none";
  return arr.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(", ");
}

// ─────────────────────────────────────────────────────────────
// PATH DATA
// ─────────────────────────────────────────────────────────────
export function buildPaths(pet) {
  if (!pet) return [];
  const name      = pet.name;
  // Use both snake_case (from API) and camelCase (legacy) for coat type
  const rawCoat   = pet.coat_type || pet.coatType || pet.doggy_soul_answers?.coat_type || "";
  const coat      = rawCoat.replace(/\bcoat\b/gi, "").trim() || ""; // strip "coat" suffix to avoid "coat coat"
  const coatDisplay = coat ? `${coat} coat` : "their coat";         // e.g. "long silky coat"
  const comfort   = pet.groomingComfort || pet.grooming_comfort || "comfortable";
  const condition = pet.healthCondition || pet.health_condition || pet.health_data?.chronic_conditions?.[0];
  const breed     = pet.breed || "their breed";
  const dental    = pet.dentalHealth || pet.dental_health || "good";
  const anxiety   = (pet.anxietyTriggers || pet.anxiety_triggers || []).join(", ") || "none noted";

  return [
    // ── PATH 1: GROOMING ─────────────────────────────────────
    {
      id: "grooming",
      icon: "✂️",
      iconBg: "#FCE4EC",
      accentColor: "#C2185B",
      accentBg: "#FCE4EC",
      accentBorder: "#F48FB1",
      badge: "Mira Pick",
      badgeBg: "#C2185B",
      photoBg: "linear-gradient(135deg,#FCE4EC,#F8BBD9)",
      title: "Grooming Path",
      desc: `${coatDisplay} · ${comfort} with grooming · Mira arranges the perfect grooming experience for ${name}.`,
      stepLabels: ["Grooming mode", "Frequency & schedule", "Products for home", "Your grooming plan"],
      miraNote: `${name}'s ${coatDisplay} is already noted. Every recommendation here is matched to ${breed} coat needs and ${name}'s ${comfort.toLowerCase()} grooming temperament.`,

      step1: {
        title: "How would you like grooming arranged?",
        desc: `Choose what works for ${name} and your lifestyle. Mira will match the right groomer.`,
        type: "select_one",
        miraPick: comfort === "Comfortable" || comfort === "Loves it" ? "At salon" : "Home visit",
        options: [
          { icon:"🏠", name:"Home visit", desc:"Groomer comes to you — less stress for anxious dogs", mira: comfort === "Anxious" || comfort === "Tolerates it" },
          { icon:"💇", name:"At salon", desc:"Full salon experience — professional equipment", mira: comfort === "Comfortable" || comfort === "Loves it" },
          { icon:"✦", name:"Let Mira recommend", desc:"Based on your pet's needs and your location", mira:false },
          { icon:"🛁", name:"At-home by me", desc:"I groom at home — help me do it right", mira:false },
        ],
      },

      step2: {
        title: "Grooming frequency & schedule",
        desc: `${breed} coats typically need grooming every 4-6 weeks. Choose what works for ${name}.`,
        type: "select_one",
        miraPick: "Every 4 weeks",
        options: [
          { icon:"📅", name:"Every 4 weeks", desc:"Ideal for long silky coats like Shih Tzus", mira:true },
          { icon:"📅", name:"Every 6 weeks", desc:"Manageable for most coat types", mira:false },
          { icon:"📅", name:"Every 8 weeks", desc:"For shorter or lower-maintenance coats", mira:false },
          { icon:"📅", name:"As needed", desc:"I'll decide each time", mira:false },
        ],
      },

      step3: {
        title: `Products for ${name}'s at-home care`,
        desc: `Between grooming appointments, these keep ${name}'s ${coatDisplay} in the best condition.`,
        type: "multi_select",
        options: [
          { icon:"🧴", name:"Coat-matched shampoo", desc:`Formulated for ${coatDisplay}` },
          { icon:"💧", name:"Detangling conditioner", desc:"Prevents mats between appointments" },
          { icon:"🪮", name:"Daily brush", desc:"5 minutes a day keeps matting away" },
          { icon:"🐾", name:"Paw balm", desc:"Keeps paws soft and protected" },
          { icon:"🌿", name:"Finishing coat spray", desc:"Shine and manageability" },
        ],
      },

      step4: {
        title: `${name}'s Grooming Plan`,
        summaryFields: ["Grooming mode", "Frequency", "Home care products", "Next step"],
        cta: "✂️ Hand to Concierge®",
        conciergeNote: "Your Concierge® will find the right groomer for your area, confirm availability, and book the first appointment.",
      },
    },

    // ── PATH 2: DENTAL HEALTH ────────────────────────────────
    {
      id: "dental",
      icon: "🦷",
      iconBg: "#E0F2F1",
      accentColor: "#00695C",
      accentBg: "#E0F2F1",
      accentBorder: "#80CBC4",
      badge: "Mira Pick",
      badgeBg: "#00695C",
      photoBg: "linear-gradient(135deg,#E0F2F1,#B2EBF2)",
      title: "Dental Health Path",
      desc: `Current dental health: ${dental}. Mira builds a daily dental routine and schedules professional care.`,
      stepLabels: ["Current dental state", "Daily routine", "Professional care", "Your dental plan"],
      miraNote: `${name}'s dental health is ${dental.toLowerCase()}. ${dental === "Needs attention" || dental === "Has dental issues" ? `Mira wants to help address this properly.` : `Mira wants to keep it that way with a consistent routine.`}`,

      step1: {
        title: `What's ${name}'s dental situation right now?`,
        desc: "Mira will build the right routine based on where things stand today.",
        type: "confirm_condition",
        confirmed: dental,
        options: ["Excellent — clean and healthy", "Good — regular brushing needed", "Needs attention — some tartar buildup", "Has dental issues — vet involvement needed", "Not sure — never checked"],
      },

      step2: {
        title: "Build a daily dental routine",
        desc: `Choose what you can commit to for ${name}. Mira will start with the most impactful.`,
        type: "multi_select",
        options: [
          { icon:"🪥", name:"Daily tooth brushing", desc:"Most effective — 2 minutes, finger brush or regular brush" },
          { icon:"🦴", name:"Daily dental chew", desc:"Complements brushing, reduces tartar" },
          { icon:"💧", name:"Water additive", desc:"Tasteless, added to bowl — passive plaque control" },
          { icon:"🌿", name:"Dental gel (no-brush)", desc:"Finger-applied — good for brush-resistant dogs" },
          { icon:"🍃", name:"Raw bone (weekly)", desc:"Natural dental cleaning — vet-supervised" },
        ],
      },

      step3: {
        title: "Professional dental care",
        desc: `Most dogs need a professional dental cleaning annually. Mira will coordinate this for ${name}.`,
        type: "select_one",
        miraPick: "Annual professional cleaning — Concierge® arranges",
        options: [
          { icon:"🏥", name:"Annual professional cleaning", desc:"Concierge® finds and books a trusted vet", mira:true },
          { icon:"🔍", name:"Dental assessment first", desc:"Vet check to understand the current state", mira: dental === "Needs attention" || dental === "Not sure — never checked" },
          { icon:"🏠", name:"At-home assessment kit", desc:"Dental health check guide from Mira", mira:false },
          { icon:"📋", name:"Vet referral for dental issues", desc:"Specialist coordination for complex problems", mira: dental === "Has dental issues — vet involvement needed" },
        ],
      },

      step4: {
        title: `${name}'s Dental Health Plan`,
        summaryFields: ["Current dental state", "Daily routine", "Professional care", "Next step"],
        cta: "🦷 Hand to Concierge®",
        conciergeNote: "Your Concierge® will source the right dental products and coordinate the professional cleaning appointment.",
      },
    },

    // ── PATH 3: SENIOR CARE ──────────────────────────────────
    {
      id: "senior",
      icon: "🌸",
      iconBg: "#E3F2FD",
      accentColor: "#1565C0",
      accentBg: "#E3F2FD",
      accentBorder: "#90CAF9",
      badge: "Mira Pick",
      badgeBg: "#1565C0",
      photoBg: "linear-gradient(135deg,#E3F2FD,#BBDEFB)",
      title: "Senior Care Path",
      desc: `Comfort, mobility, and gentle care for ${name}'s golden years — coordinated with love.`,
      stepLabels: ["Senior priorities", "Comfort setup", "Supplement protocol", "Your senior plan"],
      miraNote: `Senior dogs need different care. Every recommendation here is gentle, appropriate for ${name}'s age and breed, and coordinated with your vet where needed.`,

      step1: {
        title: `What does ${name} need most right now?`,
        desc: "Mira will prioritise the whole plan around your answer.",
        type: "multi_select",
        options: [
          { icon:"🦴", name:"Joint support & mobility", desc:"Arthritis, stiffness, difficulty getting up" },
          { icon:"💤", name:"Comfort & rest quality", desc:"Better sleep, softer surfaces, warmth" },
          { icon:"🧠", name:"Cognitive support", desc:"Mental sharpness, awareness, orientation" },
          { icon:"🫁", name:"Digestive care", desc:"Sensitive stomach, slower metabolism" },
          { icon:"🛡️", name:"Immune support", desc:"More vulnerable to illness in senior years" },
          { icon:"⚡", name:"Energy & vitality", desc:"Counteract fatigue and low motivation" },
        ],
      },

      step2: {
        title: "Comfort setup for home",
        desc: `Simple changes at home that make a big difference to ${name}'s daily comfort.`,
        type: "multi_select",
        options: [
          { icon:"🛏️", name:"Orthopaedic bed", desc:"Memory foam — pressure relief for joints" },
          { icon:"🪜", name:"Ramp or steps", desc:"Reduces joint strain getting to sofa or bed" },
          { icon:"🍽️", name:"Raised feeding station", desc:"Reduces neck and back strain while eating" },
          { icon:"🌡️", name:"Self-warming blanket", desc:"Reflects body heat — no electricity needed" },
          { icon:"💡", name:"Night light near bed", desc:"Helps dogs with reduced night vision" },
        ],
      },

      step3: {
        title: "Senior supplement protocol",
        desc: `Mira has ranked these for ${name}'s age and breed. All vet-checked.`,
        type: "multi_select",
        options: [
          { icon:"🦴", name:"Glucosamine & Chondroitin", desc:"Joint support — cartilage and mobility" },
          { icon:"🐟", name:"Salmon Oil (Omega 3)", desc:"Brain, coat, joints, and heart" },
          { icon:"🌿", name:"Turmeric & Black Pepper", desc:"Natural anti-inflammatory" },
          { icon:"🌱", name:"Probiotic Powder", desc:"Digestive support — senior guts need help" },
          { icon:"🧪", name:"Vitamin E & Antioxidants", desc:"Cognitive support and cellular health" },
        ],
      },

      step4: {
        title: `${name}'s Senior Care Plan`,
        summaryFields: ["Senior priorities", "Comfort setup", "Supplement protocol", "Next step"],
        cta: "🌸 Hand to Concierge®",
        conciergeNote: "Your Concierge® will source senior care products, coordinate with your vet, and set up a regular wellbeing check.",
      },
    },

    // ── PATH 4: POST-SURGERY RECOVERY ────────────────────────
    {
      id: "recovery",
      icon: "💜",
      iconBg: "#F3E5F5",
      accentColor: "#6A1B9A",
      accentBg: "#F3E5F5",
      accentBorder: "#CE93D8",
      badge: "Mira Pick",
      badgeBg: "#6A1B9A",
      photoBg: "linear-gradient(135deg,#F3E5F5,#E1BEE7)",
      title: "Post-Surgery Recovery Path",
      desc: `Complete recovery coordination for ${name} — wound care, nutrition, restricted activity, and vet follow-up.`,
      stepLabels: ["Type of surgery", "Recovery setup", "Nutrition & supplements", "Your recovery plan"],
      miraNote: `Recovery needs careful, gentle management. Mira will build ${name}'s protocol around the surgery type and your vet's guidance. We coordinate, but your vet leads.`,

      step1: {
        title: `What surgery or procedure did ${name} have?`,
        desc: "Mira will match the recovery protocol exactly to the type of procedure.",
        type: "select_one",
        miraPick: condition ? `Recovery from ${condition} treatment` : "Soft tissue surgery",
        options: [
          { icon:"🦴", name:"Orthopaedic surgery", desc:"Bone, joint, or ligament repair", mira:false },
          { icon:"🫁", name:"Soft tissue surgery", desc:"Abdominal, internal organ, or mass removal", mira: !condition },
          { icon:"💜", name:`Recovery from ${condition || "medical treatment"}`, desc:"Post-treatment recovery and immune support", mira: !!condition },
          { icon:"🦷", name:"Dental surgery", desc:"Extractions or dental procedure recovery", mira:false },
          { icon:"✂️", name:"Spay or neuter", desc:"Standard recovery protocol", mira:false },
          { icon:"👁️", name:"Eye surgery", desc:"Specialist post-operative care", mira:false },
        ],
      },

      step2: {
        title: `Set up ${name}'s recovery space`,
        desc: "Comfort and restricted movement are the most important parts of early recovery.",
        type: "multi_select",
        options: [
          { icon:"🛏️", name:"Recovery crate or pen", desc:"Restricts movement safely — essential" },
          { icon:"🔵", name:"E-collar (cone)", desc:"Prevents licking or chewing wound" },
          { icon:"🛏️", name:"Soft orthopaedic bed", desc:"Pressure-free rest surface" },
          { icon:"🌡️", name:"Warming blanket", desc:"Warmth supports recovery" },
          { icon:"📋", name:"Wound care supplies", desc:"Mira will suggest vet-appropriate items" },
        ],
      },

      step3: {
        title: "Recovery nutrition & supplements",
        desc: `These support ${name}'s healing. All gentle and appropriate for recovery.`,
        type: "multi_select",
        options: [
          { icon:"🐟", name:"Salmon Oil (Omega 3)", desc:"Anti-inflammatory — healing support" },
          { icon:"🌱", name:"Probiotic Powder", desc:"Gut health often disrupted post-surgery" },
          { icon:"🌿", name:"Colostrum Supplement", desc:"Immune and gut barrier support" },
          { icon:"🍲", name:"Recovery soft food", desc:"Easy to eat, high protein, gentle" },
          { icon:"💊", name:"Vitamin C", desc:"Supports tissue repair and immunity" },
        ],
      },

      step4: {
        title: `${name}'s Recovery Plan`,
        summaryFields: ["Surgery type", "Recovery setup", "Nutrition & supplements", "Next step"],
        cta: "💜 Hand to Concierge®",
        conciergeNote: "Your Concierge® will coordinate with your vet for the recovery protocol, source supplies, and schedule follow-up check-ins.",
      },
    },

    // ── PATH 5: ANXIETY & BEHAVIOUR ──────────────────────────
    {
      id: "anxiety",
      icon: "🧡",
      iconBg: "#FFF3E0",
      accentColor: "#E65100",
      accentBg: "#FFF3E0",
      accentBorder: "#FFCC02",
      badge: "Mira Pick",
      badgeBg: "#E65100",
      photoBg: "linear-gradient(135deg,#FFF3E0,#FFE0B2)",
      title: "Anxiety & Behaviour Path",
      desc: `${name}'s known triggers: ${anxiety}. Mira builds a gentle approach plan — calming products, routine support, and specialist referral if needed.`,
      stepLabels: ["Identify triggers", "Calming approach", "Products & tools", "Your calm plan"],
      miraNote: `${name}'s anxiety triggers are already noted. Everything here is gentle and evidence-based. Mira will never suggest anything that causes additional stress.`,

      step1: {
        title: `What triggers ${name}'s anxiety?`,
        desc: "Pre-filled from soul profile. Add any others Mira should know about.",
        type: "multi_select",
        options: [
          { icon:"🔊", name:"Loud noises", desc:"Thunder, fireworks, traffic" },
          { icon:"🚗", name:"Car travel", desc:"Motion sickness or travel anxiety" },
          { icon:"👥", name:"Strangers or crowds", desc:"Social anxiety" },
          { icon:"🏥", name:"Vet visits", desc:"Medical or grooming anxiety" },
          { icon:"🏠", name:"Being left alone", desc:"Separation anxiety" },
          { icon:"🌩️", name:"Storms", desc:"Barometric pressure sensitivity" },
          { icon:"🐕", name:"Other dogs", desc:"Reactivity or dog-directed anxiety" },
        ],
      },

      step2: {
        title: "Choose a calming approach",
        desc: `Mira will build the routine around whichever approach works best for ${name}.`,
        type: "select_one",
        miraPick: "Gradual desensitisation with calming products",
        options: [
          { icon:"🌿", name:"Gradual desensitisation", desc:"Gentle exposure training over time", mira:true },
          { icon:"💊", name:"Calming supplements first", desc:"Natural products to reduce baseline anxiety", mira:false },
          { icon:"🎵", name:"Environmental management", desc:"Music, compression vests, safe spaces", mira:false },
          { icon:"👩‍⚕️", name:"Specialist referral", desc:"Certified animal behaviourist", mira:false },
        ],
      },

      step3: {
        title: "Calming products & tools",
        desc: `Evidence-based, non-sedating. All appropriate for ${name}'s size and breed.`,
        type: "multi_select",
        options: [
          { icon:"🌸", name:"Pheromone diffuser (Adaptil)", desc:"Mimics calming canine pheromones" },
          { icon:"👕", name:"Anxiety compression wrap", desc:"ThunderShirt-style — reduces cortisol" },
          { icon:"🌿", name:"Calming supplement (Zylkene)", desc:"Milk protein — natural calming" },
          { icon:"🎵", name:"Calming music playlist", desc:"Species-specific music — Mira will share" },
          { icon:"🏠", name:"Safe den/crate setup", desc:"Covered, cosy retreat for stressful moments" },
        ],
      },

      step4: {
        title: `${name}'s Calm Plan`,
        summaryFields: ["Known triggers", "Calming approach", "Products & tools", "Next step"],
        cta: "🧡 Hand to Concierge®",
        conciergeNote: "Your Concierge® will source calming products and, if needed, connect you with a certified animal behaviourist.",
      },
    },

    // ── PATH 6: PREVENTIVE WELLNESS ──────────────────────────
    {
      id: "preventive",
      icon: "🌿",
      iconBg: "#E8F5E9",
      accentColor: "#2D6A4F",
      accentBg: "#E8F5E9",
      accentBorder: "#A5D6A7",
      badge: "Mira Pick",
      badgeBg: "#2D6A4F",
      photoBg: "linear-gradient(135deg,#E8F5E9,#C8E6C9)",
      title: "Preventive Wellness Path",
      desc: `Vaccination status, health checks, and Mira-managed preventive care reminders for ${name}.`,
      stepLabels: ["Vaccination status", "Annual health checks", "Monthly preventives", "Your wellness calendar"],
      miraNote: `Prevention is everything. Mira will build ${name}'s wellness calendar and send reminders so nothing is ever missed. ${pet.vaccinated ? `${name}'s vaccinations are already up to date — great start.` : `Mira has flagged that vaccination status needs attention.`}`,

      step1: {
        title: `Where are ${name}'s vaccinations right now?`,
        desc: "Pre-filled from soul profile. Confirm below.",
        type: "confirm_condition",
        confirmed: pet.vaccinated ? "Up to date" : "Needs attention",
        options: [
          "Up to date — all core vaccines current",
          "Due soon — within the next 3 months",
          "Overdue — needs to be scheduled",
          "Partially vaccinated — some missing",
          "Not sure — records not available",
        ],
      },

      step2: {
        title: "Annual health check schedule",
        desc: `These are the check-ups Mira recommends every year for a ${pet.age}-year-old ${breed}.`,
        type: "multi_select",
        options: [
          { icon:"🏥", name:"Annual wellness exam", desc:"Full body check by your vet" },
          { icon:"🩸", name:"Annual blood panel", desc:"Catches issues before symptoms appear" },
          { icon:"🦷", name:"Dental assessment", desc:"Annual check for tartar and gum health" },
          { icon:"👁️", name:"Eye and ear check", desc:"Especially important for long-coated breeds" },
          { icon:"🐾", name:"Parasite screening", desc:"Heartworm, tick-borne diseases" },
        ],
      },

      step3: {
        title: "Monthly preventive routine",
        desc: `These protect ${name} month to month. Mira will send reminders.`,
        type: "multi_select",
        options: [
          { icon:"🦟", name:"Flea & tick prevention", desc:"Monthly topical or oral treatment" },
          { icon:"🪱", name:"Deworming", desc:"Monthly or quarterly — breed dependent" },
          { icon:"🫀", name:"Heartworm prevention", desc:"Monthly tablet — essential in India" },
          { icon:"🪮", name:"Grooming check", desc:"Coat, ears, nails — monthly at minimum" },
          { icon:"⚖️", name:"Weight check", desc:"Monthly weigh-in — catch changes early" },
        ],
      },

      step4: {
        title: `${name}'s Wellness Calendar`,
        summaryFields: ["Vaccination status", "Annual checks", "Monthly routine", "Next step"],
        cta: "🌿 Hand to Concierge®",
        conciergeNote: "Your Concierge® will set up reminders, book the first vet visit, and coordinate ongoing preventive care.",
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
        const stepNum   = i + 1;
        const isComplete = completedSteps.includes(stepNum);
        const isCurrent  = currentStep === stepNum;
        const isPending  = !isComplete && !isCurrent;
        return (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background: isComplete || isCurrent ? accentColor : "#E0D8D0", color: isComplete || isCurrent ? "#fff" : "#999", display:"flex", alignItems:"center", justifyContent:"center", fontSize: isComplete ? 14 : 13, fontWeight:700, transition:"all 0.2s" }}>
                {isComplete ? "✓" : stepNum}
              </div>
              {i < steps.length - 1 && <div style={{ width:2, height:28, background: isComplete ? accentColor : "#E0D8D0", transition:"background 0.3s" }} />}
            </div>
            <div style={{ paddingTop:6, paddingBottom: i < steps.length - 1 ? 28 : 16, fontSize:14, fontWeight: isCurrent ? 700 : 400, color: isPending ? "#BBB" : "#1A0A00" }}>
              {label}
              {isComplete && <span style={{ marginLeft:10, fontSize:11, fontWeight:600, color:accentColor, background:`${accentColor}18`, borderRadius:20, padding:"1px 8px" }}>✓ Done</span>}
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
    <div onClick={() => onSelect(option.name || option)} style={{ background: selected ? `${accentColor}10` : "#fff", border:`1.5px solid ${selected ? accentColor : "#F0E8E0"}`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"all 0.12s", marginBottom:6 }}>
      {option.icon && <span style={{ fontSize:24, flexShrink:0 }}>{option.icon}</span>}
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
          <span style={{ fontSize:14, fontWeight:700, color:"#1A0A00" }}>{option.name || option}</span>
          {option.mira && <span style={{ background:`${accentColor}18`, color:accentColor, fontSize:10, fontWeight:700, borderRadius:20, padding:"1px 7px" }}>★ Mira's pick</span>}
        </div>
        {option.desc && <div style={{ fontSize:12, color:"#888" }}>{option.desc}</div>}
      </div>
      {selected && <div style={{ width:22, height:22, borderRadius:"50%", background:accentColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700, flexShrink:0 }}>✓</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PATH FLOW MODAL
// ─────────────────────────────────────────────────────────────
export function PathFlowModal({ path, pet, onClose }) {
  // Guard: if path is undefined (allPaths.find returned nothing), close immediately
  // Without this, the modal crashes mid-render, activePath stays truthy, backdrop persists
  useEffect(() => { if (!path) onClose(); }, [path, onClose]);
  if (!path) return null;

  const { fire } = useConcierge({ pet, pillar: 'care' });
  const [currentStep,    setCurrentStep]    = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [selections,     setSelections]     = useState({ step1:[], step2:null, step3:[], step4:null });
  const [submitted,      setSubmitted]      = useState(false);

  const totalSteps = 4;

  const completeStep = (step) => {
    if (!completedSteps.includes(step)) setCompletedSteps(prev => [...prev, step]);
    if (step < totalSteps) setCurrentStep(step + 1);
  };

  const handleSel1 = (val) => {
    if (path.step1.type === "confirm_condition") {
      setSelections(prev => ({ ...prev, step1: [val] }));
    } else {
      setSelections(prev => {
        const cur = prev.step1;
        return { ...prev, step1: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
      });
    }
  };

  const handleSel2 = (val) => setSelections(prev => ({ ...prev, step2: val }));

  const handleSel3 = (val) => {
    setSelections(prev => {
      const cur = prev.step3;
      if (path.step3.type === "select_one") return { ...prev, step3:[val] };
      return { ...prev, step3: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] };
    });
  };

  const handleSubmit = async () => {
    const petName = pet?.name || 'your dog';
    const allergies = (pet?.allergies || []).join(', ') || 'none';
    await fire({
      type: 'path',
      name: path.title,
      channel: 'care_guided_path_submit',
      note: `Selections: Step1=${selections.step1.join(', ')||'—'}, Step2=${selections.step2||'—'}, Step3=${selections.step3.join(', ')||'—'}`,
      metadata: {
        path_id: path.id,
        path_title: path.title,
        pet_breed: pet?.breed,
        pet_allergies: allergies,
        selections,
      },
    });
    setSubmitted(true);
  };

  // Submitted
  if (submitted) {
    return (
      <ModalShell onClose={onClose} noPadding>
        <div style={{ background:`linear-gradient(135deg,#0A1F12,#152A1E)`, borderRadius:20, padding:"48px 40px", textAlign:"center", minHeight:320, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:`linear-gradient(135deg,${path.accentColor},#74C69D)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:20 }}>♥</div>
          <div style={{ fontSize:22, fontWeight:800, color:"#FFFFFF", fontFamily:"Georgia,serif", marginBottom:10 }}>{path.title.replace(" Path","")} sent to your Concierge®.</div>
          <div style={{ fontSize:14, color:"rgba(255,255,255,0.55)", marginBottom:28, lineHeight:1.6 }}>Everything is in good hands.<br/>Your Concierge® will reach out within 48 hours. ♥</div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.20)", color:"#fff", borderRadius:20, padding:"10px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Start again</button>
        </div>
      </ModalShell>
    );
  }

  // Summary (step 4)
  if (currentStep === 4 && completedSteps.includes(3)) {
    const summaryData = {
      [path.step4.summaryFields[0]]: selections.step1.join(", ") || "Not specified",
      [path.step4.summaryFields[1]]: selections.step2 || "Not selected",
      [path.step4.summaryFields[2]]: selections.step3.join(", ") || "Not selected",
      [path.step4.summaryFields[3]]: "Concierge® will contact within 48h",
    };
    return (
      <ModalShell onClose={onClose}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{path.icon}</div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:"#1A0A00", fontFamily:"Georgia,serif" }}>{path.title.replace(" Path", ` for ${pet.name}`)}</div>
            <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{path.step4.summaryFields.join(" · ")} · All confirmed</div>
          </div>
          <button onClick={onClose} style={{ marginLeft:"auto", background:"#F5F5F5", border:"none", borderRadius:"50%", width:32, height:32, fontSize:16, cursor:"pointer", color:"#555" }}>✕</button>
        </div>
        <div style={{ background:"#fff", border:"1px solid #F0E8E0", borderRadius:14, marginBottom:20, overflow:"hidden" }}>
          {Object.entries(summaryData).map(([k,v], i) => (
            <div key={k} style={{ display:"flex", alignItems:"flex-start", padding:"14px 18px", borderBottom: i < Object.entries(summaryData).length - 1 ? "1px solid #F5F0EA" : "none" }}>
              <div style={{ fontSize:13, fontWeight:700, color:path.accentColor, width:160, flexShrink:0 }}>{k}</div>
              <div style={{ fontSize:13, color:"#1A0A00", flex:1, lineHeight:1.5 }}>{v}</div>
            </div>
          ))}
        </div>
        <button onClick={handleSubmit} style={{ width:"100%", background:`linear-gradient(135deg,${path.accentColor},#74C69D)`, color:"#fff", border:"none", borderRadius:14, padding:"16px", fontSize:16, fontWeight:800, cursor:"pointer", marginBottom:10 }}>
          {path.step4.cta}
        </button>
        <div style={{ fontSize:12, color:"#888", textAlign:"center" }}>{path.step4.conciergeNote}</div>
      </ModalShell>
    );
  }

  // Main flow
  return (
    <ModalShell onClose={onClose}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{path.icon}</div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:"#1A0A00", fontFamily:"Georgia,serif" }}>{path.title.replace(" Path", ` for ${pet.name}`)}</div>
            <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{totalSteps} steps. One complete care plan.</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background:"#F5F5F5", border:"none", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:600, color:"#555", cursor:"pointer" }}>Close</button>
      </div>

      {/* Mira banner */}
      <div style={{ background:`${path.accentColor}12`, border:`1px solid ${path.accentColor}30`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:10, marginBottom:22 }}>
        <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,${path.accentColor},#74C69D)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0 }}>✦</div>
        <div>
          <div style={{ fontSize:13, color:"#5A2800", fontStyle:"italic", lineHeight:1.55 }}>{path.miraNote}</div>
          <div style={{ fontSize:11, color:path.accentColor, fontWeight:600, marginTop:3 }}>♥ Mira knows {pet.name}</div>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator steps={path.stepLabels} currentStep={currentStep} completedSteps={completedSteps} accentColor={path.accentColor} />

      {/* Step 1 */}
      {currentStep === 1 && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step1.title}</div>
          <div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step1.desc}</div>

          {path.step1.type === "confirm_condition" && pet.healthCondition && (
            <div style={{ background:"#FFF3E0", border:"1px solid #FFCC99", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#8B4500" }}>
              ✦ From {pet.name}'s soul profile: <strong>{path.step1.confirmed}</strong>
            </div>
          )}

          {path.step1.type === "multi_select" ? (
            <>
              {path.step1.options.map(opt => (
                <OptionRow key={opt.name || opt} option={opt} selected={selections.step1.includes(opt.name || opt)} onSelect={handleSel1} accentColor={path.accentColor} />
              ))}
              <button onClick={() => selections.step1.length > 0 && completeStep(1)} style={{ marginTop:8, background: selections.step1.length > 0 ? `linear-gradient(135deg,${path.accentColor},#74C69D)` : "#E0D8D0", color: selections.step1.length > 0 ? "#fff" : "#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor: selections.step1.length > 0 ? "pointer" : "not-allowed", transition:"all 0.15s" }}>Confirm →</button>
            </>
          ) : (
            <>
              {path.step1.options.map(opt => (
                <OptionRow key={opt.name || opt} option={typeof opt === "string" ? { name:opt } : opt} selected={selections.step1.includes(opt.name || opt) || (opt.name || opt) === path.step1.confirmed} onSelect={handleSel1} accentColor={path.accentColor} />
              ))}
              <button onClick={() => { if (!selections.step1.length && path.step1.confirmed) setSelections(prev => ({...prev, step1:[path.step1.confirmed]})); completeStep(1); }} style={{ marginTop:8, background:`linear-gradient(135deg,${path.accentColor},#74C69D)`, color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Confirm →</button>
            </>
          )}
        </div>
      )}

      {/* Step 2 */}
      {currentStep === 2 && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step2.title}</div>
          <div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step2.desc}</div>
          {path.step2.options.map(opt => (
            <OptionRow key={opt.name} option={opt} selected={selections.step2 === opt.name} onSelect={handleSel2} accentColor={path.accentColor} />
          ))}
          <button onClick={() => selections.step2 && completeStep(2)} style={{ marginTop:8, background: selections.step2 ? `linear-gradient(135deg,${path.accentColor},#74C69D)` : "#E0D8D0", color: selections.step2 ? "#fff" : "#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor: selections.step2 ? "pointer" : "not-allowed", transition:"all 0.15s" }}>Confirm →</button>
        </div>
      )}

      {/* Step 3 */}
      {currentStep === 3 && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step3.title}</div>
          <div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step3.desc}</div>
          {path.step3.options.map(opt => (
            <OptionRow key={opt.name} option={opt} selected={selections.step3.includes(opt.name)} onSelect={handleSel3} accentColor={path.accentColor} />
          ))}
          <button onClick={() => selections.step3.length > 0 && completeStep(3)} style={{ marginTop:8, background: selections.step3.length > 0 ? `linear-gradient(135deg,${path.accentColor},#74C69D)` : "#E0D8D0", color: selections.step3.length > 0 ? "#fff" : "#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor: selections.step3.length > 0 ? "pointer" : "not-allowed", transition:"all 0.15s" }}>
            See {pet.name}'s Plan →
          </button>
        </div>
      )}
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────
// MODAL SHELL
// ─────────────────────────────────────────────────────────────
function ModalShell({ onClose, children, noPadding }) {
  return (
    <>
      {/* Backdrop — standalone so its backdropFilter never bleeds into modal content */}
      <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.55)" }} />
      {/* Modal content — sibling at higher z-index, centered independently */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position:"fixed", zIndex:10000,
          top:"50%", left:"50%", transform:"translate(-50%,-50%)",
          background:"#fff", borderRadius:20,
          width:"min(720px,calc(100vw - 40px))", maxHeight:"90vh",
          overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.20)",
          padding: noPadding ? 0 : "28px 28px 24px", border:"2px solid #F0E8E0"
        }}
      >
        {children}
      </div>
    </>
  );
}

  // ── MAIN EXPORT ──────────────────────────────────────────────
export default function GuidedCarePaths({ pet }) {
  const [activePath, setActivePath] = useState(null);

  // Escape key always closes the modal — belt-and-suspenders guarantee
  useEffect(() => {
    if (!activePath) return;
    const onKey = (e) => { if (e.key === 'Escape') setActivePath(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePath]);

  const allPaths = buildPaths(pet);
  const petName  = pet?.name || "your pet";

  return (
    <section style={{ marginBottom: 32 }}>

      {activePath && (
        <PathFlowModal
          path={allPaths.find(p => p.id === activePath)}
          pet={pet}
          onClose={() => setActivePath(null)}
        />
      )}

      {/* Section Header — matches GuidedNutritionPaths */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontSize: "clamp(1.3rem,5vw,2rem)",
          fontWeight: 800, color: "#1B4332",
          fontFamily: "Georgia, serif",
          marginBottom: 6, lineHeight: 1.2,
        }}>
          Guided Care Paths
        </h2>
        <p style={{ fontSize: 14, color: "#52796F", marginTop: 6, lineHeight: 1.5 }}>
          Mira walks {petName} through every step. Each path ends with a plan you can keep.
        </p>
      </div>

      {/* 3-column grid — identical to GuidedNutritionPaths */}
      <style>{`
        .guided-care-paths-grid { grid-template-columns: repeat(3,1fr); }
        @media (max-width:767px)  { .guided-care-paths-grid { grid-template-columns: 1fr; } }
        @media (min-width:768px) and (max-width:1023px) { .guided-care-paths-grid { grid-template-columns: repeat(2,1fr); } }
      `}</style>
      <div style={{ display: "grid", gap: 16 }} className="guided-care-paths-grid">
        {allPaths.map(path => (
          <CarePathCard
            key={path.id}
            path={path}
            petName={petName}
            onOpen={() => {
              tdc.request({ text: `Started guided care path: ${path.title}`, name: path.title, pillar: "care", pet, channel: "care_guided_paths_start" });
              setActivePath(path.id);
            }}
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// CARE PATH CARD — mirrors NutritionPathCard exactly
// ─────────────────────────────────────────────────────────────
function CarePathCard({ path, petName, onOpen }) {
  const [hovered, setHovered] = useState(false);
  const visibleSteps = path.stepLabels.slice(0, 3);
  const hiddenCount  = path.stepLabels.length - 3;

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
        position: "relative", borderRadius: 20, padding: 24, cursor: "pointer",
        background: path.accentBg,
        border: `2px solid ${hovered ? path.accentColor : "transparent"}`,
        boxShadow: hovered ? `0 8px 24px ${a12}` : "none",
        transform: hovered ? "translateY(-3px)" : "none",
        transition: "transform 200ms ease, box-shadow 200ms ease, border 200ms ease",
        minHeight: 220,
      }}
      data-testid={`care-path-${path.id}`}
    >
      {/* Icon box */}
      <div style={{ width:52, height:52, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, background:a20, marginBottom:16 }}>
        {path.icon}
      </div>

      {/* Title */}
      <h3 style={{ fontSize:18, fontWeight:800, color:"#1B4332", marginBottom:8 }}>{path.title}</h3>

      {/* Description */}
      <p style={{ fontSize:13, color:"#52796F", lineHeight:1.6, marginBottom:16, minHeight:60 }}>{path.desc}</p>

      {/* Step chips */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:12 }}>
        {visibleSteps.map((step, i) => (
          <span key={i} style={{ borderRadius:9999, padding:"4px 12px", fontSize:12, fontWeight:500, background:a15, color:path.accentColor }}>{step}</span>
        ))}
        {hiddenCount > 0 && (
          <span style={{ borderRadius:9999, padding:"4px 12px", fontSize:12, fontWeight:700, background:a15, color:path.accentColor }}>+{hiddenCount} more</span>
        )}
      </div>

      {/* Mira badge */}
      <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:a15, borderRadius:9999, padding:"3px 10px" }}>
        <span style={{ fontSize:10, color:path.accentColor }}>★</span>
        <span style={{ fontSize:10, fontWeight:700, color:path.accentColor }}>Mira Pick</span>
      </div>

      {/* Chevron */}
      <span style={{ position:"absolute", bottom:18, right:20, fontSize:20, color:hovered ? path.accentColor : a50, transition:"color 200ms ease", userSelect:"none" }}>›</span>
    </div>
  );
}
