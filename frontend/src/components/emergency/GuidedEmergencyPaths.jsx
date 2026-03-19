/**
 * GuidedEmergencyPaths.jsx — /emergency pillar
 * The Doggy Company
 *
 * Mirrors GuidedCarePaths.jsx exactly — same components, same 4-step pattern.
 * Crimson colour world (#DC2626).
 *
 * 5 PATHS:
 *   1. Emergency Preparedness    — build a complete emergency kit + plan
 *   2. Lost Pet Protocol         — what to do immediately when a pet is lost
 *   3. First Aid Readiness       — assess home kit + learn the basics
 *   4. Insurance & Financial     — get the right cover before emergencies happen
 *   5. Emergency Vet Network     — save the right vets before you need them
 *
 * HOW TO USE:
 *   import GuidedEmergencyPaths from "../components/emergency/GuidedEmergencyPaths";
 *   <GuidedEmergencyPaths pet={petData} />
 *
 * WIRING:
 *   POST /api/concierge/emergency-path
 *   body: { petId, pathId, selections }
 */
import { useState } from "react";

const G = {
  deep:"#7F1D1D", mid:"#991B1B", crimson:"#DC2626", light:"#FCA5A5",
  pale:"#FEF2F2", cream:"#FFF5F5", darkText:"#7F1D1D", mutedText:"#991B1B",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ─── BUILD PATHS ─────────────────────────────────────────────
function buildPaths(pet) {
  const name    = pet?.name || "your dog";
  const breed   = pet?.breed || pet?.doggy_soul_answers?.breed || "your breed";
  const age     = parseInt(pet?.doggy_soul_answers?.age_years || "0") || 0;
  const senior  = age >= 7;
  const puppy   = age <= 1;
  const insured = !!(pet?.doggy_soul_answers?.insurance);
  const chipped = !!(pet?.doggy_soul_answers?.microchipped);
  const hasKit  = !!(pet?.doggy_soul_answers?.first_aid_kit);

  return [
    // ── PATH 1: EMERGENCY PREPAREDNESS ───────────────────────
    {
      id:"preparedness",
      icon:"🛡️",
      iconBg:"#FEF2F2", accentColor:G.crimson, accentBg:"#FEF2F2",
      accentBorder:"#FCA5A5", badgeBg:G.crimson, badge:"Start here",
      photoBg:`linear-gradient(135deg,#FEF2F2,#FFCDD2)`,
      title:"Emergency Preparedness Path",
      desc:`Build ${name}'s complete emergency plan — kit, contacts, protocols — so you're never caught unprepared.`,
      stepLabels:["What's already in place","Build the emergency kit","Set up emergency contacts","Your emergency plan"],
      miraNote:`I've checked ${name}'s profile. ${chipped?`${name} is microchipped — good start.`:`${name}'s microchip status needs attention.`} Let me build the complete preparedness plan around what ${name} already has.`,

      step1:{
        title:`What's already in place for ${name}?`,
        desc:"Pre-filled from soul profile. Confirm and add anything Mira might have missed.",
        type:"multi_select",
        options:[
          { icon:"🔬", name:"Microchip registered",    desc:"Permanent ID on file",                   mira:chipped },
          { icon:"🏷️", name:"Medical alert tag",       desc:"On the collar, always visible",          mira:!chipped },
          { icon:"🏥", name:"Emergency vet saved",      desc:"Number saved in your phone",             mira:true },
          { icon:"🧰", name:"First aid kit at home",    desc:"Basic kit for immediate care",            mira:!hasKit },
          { icon:"🛡️", name:"Pet insurance active",    desc:"Policy and claim number accessible",     mira:!insured },
          { icon:"📋", name:"Emergency info card",      desc:"In your wallet — vet, conditions, meds", mira:true },
        ],
      },
      step2:{
        title:`Build ${name}'s emergency kit`,
        desc:"Mira recommends building this in layers — immediate response items first.",
        type:"multi_select",
        options:[
          { icon:"🩺", name:"Pet first aid kit",          desc:"Bandages, antiseptic, thermometer, gloves" },
          { icon:"📋", name:"Emergency laminated card",   desc:"Waterproof — CPR steps, vet numbers, conditions" },
          { icon:"📍", name:"GPS collar tracker",         desc:"Real-time location — especially for escape artists" },
          { icon:"🎒", name:"Emergency grab pouch",       desc:"Meds, food, documents in one bag — grab and go" },
          { icon:"🔬", name:"Microchip info card",        desc:"Number, registry, vet — in your wallet" },
          { icon:"🚐", name:"Emergency transport number", desc:"Pet-safe vehicle on speed dial" },
        ],
      },
      step3:{
        title:"Emergency contacts to save right now",
        desc:`These are the numbers that matter when something happens to ${name}. Save them before you need them.`,
        type:"multi_select",
        options:[
          { icon:"🏥", name:"Nearest 24hr emergency vet",     desc:"Mira will find the closest one to you", mira:true },
          { icon:"🐾", name:"Backup vet (not usual vet)",      desc:"For when your regular vet is unavailable" },
          { icon:"☎️", name:"Poison control helpline",        desc:"ASPCA or local equivalent — critical for toxins" },
          { icon:"🚐", name:"Emergency pet transport",         desc:"For when you can't drive and need help fast" },
          { icon:"🏠", name:"Trusted pet sitter or neighbour", desc:"Someone who can reach ${name} if you can't" },
        ],
      },
      step4:{
        title:`${name}'s Emergency Preparedness Plan`,
        summaryFields:["Current readiness","Kit to build","Contacts to save","Next step"],
        cta:"🛡️ Hand to Concierge",
        conciergeNote:"Your Concierge will source the kit items, find your nearest 24hr vet, and set up the emergency contact card.",
      },
    },

    // ── PATH 2: LOST PET PROTOCOL ─────────────────────────────
    {
      id:"lostpet",
      icon:"📍",
      iconBg:"#FFF3E0", accentColor:"#E65100", accentBg:"#FFF3E0",
      accentBorder:"#FFCC02", badgeBg:"#E65100", badge:"Act now",
      photoBg:`linear-gradient(135deg,#FFF3E0,#FFE0B2)`,
      title:"Lost Pet Protocol Path",
      desc:`A step-by-step protocol for if ${name} goes missing — start within the first 2 hours.`,
      stepLabels:["Immediate actions (0-30 mins)","Spread the word (30 mins-2hrs)","Search strategy","Recovery setup"],
      miraNote:`The first 2 hours after a pet goes missing are the most critical. Every minute matters. ${chipped?`${name}'s microchip is registered — tracing will be faster.`:`${name}'s microchip isn't registered yet — let's fix that now so this path is never needed.`}`,

      step1:{
        title:`Immediate actions for ${name} — first 30 minutes`,
        desc:"Do these in this order. Every minute counts.",
        type:"multi_select",
        options:[
          { icon:"🔍", name:"Search immediate area first",       desc:"Check hiding spots, under furniture, garden" },
          { icon:"📞", name:"Call local vets and shelters",      desc:"Report the missing pet immediately" },
          { icon:"🔬", name:"Report microchip as lost",         desc:"Update the registry — vets scan all found dogs", mira:chipped },
          { icon:"📸", name:"Get a clear recent photo ready",   desc:"Last photo, clear face — for posters and posts" },
          { icon:"🏠", name:"Leave a worn item outside",         desc:"Your scent guides ${name} back home" },
          { icon:"🚗", name:"Drive the neighbourhood slowly",   desc:"Call ${name}'s name, check gardens and driveways" },
        ],
      },
      step2:{
        title:"Spread the word — 30 minutes to 2 hours",
        desc:`The more people looking for ${name}, the better. Do all of these simultaneously.`,
        type:"multi_select",
        options:[
          { icon:"📱", name:"Post on neighbourhood apps",   desc:"Nextdoor, local Facebook groups, WhatsApp communities", mira:true },
          { icon:"🗺️", name:"Post on Lost & Found India",  desc:"Nationwide pet finder network" },
          { icon:"📋", name:"Create a lost pet poster",     desc:"A4, colour, clear photo — Mira makes the template" },
          { icon:"🏪", name:"Visit local shops & guards",  desc:"Ask people with eyes on the street" },
          { icon:"📞", name:"Contact all local rescues",    desc:"They receive lost dogs regularly" },
        ],
      },
      step3:{
        title:`Search strategy for ${name}`,
        desc:"Based on breed and personality, Mira tailors the search approach.",
        type:"select_one",
        miraPick:"Systematic grid search",
        options:[
          { icon:"🗺️", name:"Systematic grid search",      desc:"Map the area into zones — search each thoroughly",   mira:true },
          { icon:"🌙", name:"Dawn and dusk searches",       desc:"Dogs move most at quiet times — search at these hours" },
          { icon:"🏘️", name:"Shelter-to-shelter circuit",  desc:"Visit every shelter in 20km radius daily" },
          { icon:"🤝", name:"Volunteer search party",       desc:"Organise friends and neighbours for a coordinated sweep" },
        ],
      },
      step4:{
        title:`${name}'s Lost Pet Recovery Plan`,
        summaryFields:["Immediate actions","Spreading the word","Search strategy","Next step"],
        cta:"📍 Hand to Concierge",
        conciergeNote:"Your Concierge will create the poster, activate the local network, and coordinate the search.",
      },
    },

    // ── PATH 3: FIRST AID READINESS ───────────────────────────
    {
      id:"firstaid",
      icon:"🩺",
      iconBg:"#E8F5E9", accentColor:"#2E7D32", accentBg:"#E8F5E9",
      accentBorder:"#A5D6A7", badgeBg:"#2E7D32", badge:"Be ready",
      photoBg:`linear-gradient(135deg,#E8F5E9,#C8E6C9)`,
      title:"First Aid Readiness Path",
      desc:`Assess ${name}'s first aid situation and build the knowledge and kit to handle the first 10 minutes of any emergency.`,
      stepLabels:["Kit assessment","Emergency scenarios to prepare for","First aid training","Your first aid plan"],
      miraNote:`The first 10 minutes of any emergency determine the outcome. ${name}'s owner being trained and equipped is the single most important preparation — more than any product.`,

      step1:{
        title:`What's in ${name}'s first aid kit right now?`,
        desc:"Honest assessment — Mira builds from where you are.",
        type:"confirm_condition",
        confirmed: hasKit ? "First aid kit at home" : "No kit yet",
        options:[
          "Complete kit — bandages, antiseptic, thermometer, gloves, guide",
          "Partial kit — a few basics but gaps",
          "No kit yet — starting from zero",
          "Unsure — I have some things but haven't checked",
        ],
      },
      step2:{
        title:`Emergency scenarios to prepare ${name} for`,
        desc:"Mira tailors the training and kit to the scenarios most relevant to the breed and lifestyle.",
        type:"multi_select",
        options:[
          { icon:"🩸", name:"Wounds and bleeding",           desc:"Most common emergency — cuts, lacerations" },
          { icon:"☠️", name:"Poisoning or toxin ingestion",  desc:"Rat poison, plants, human foods — breed dependent" },
          { icon:"🦴", name:"Fractures and mobility injury", desc:"Falls, accidents, rough play" },
          { icon:"❤️", name:"Cardiac and breathing",         desc:"CPR and choking response" },
          { icon:"🌡️", name:"Heatstroke",                   desc:"India summers — critical for all breeds", mira:true },
          { icon:"🐝", name:"Allergic reactions and bites",  desc:"Bee stings, snake bites, insect reactions" },
        ],
      },
      step3:{
        title:"First aid training",
        desc:`Mira will arrange the right training level for ${name}'s owner.`,
        type:"select_one",
        miraPick:"Pet first aid course — certified",
        options:[
          { icon:"🎓", name:"Pet first aid course — certified", desc:"2-hour certified course — most comprehensive",   mira:true },
          { icon:"📱", name:"Online first aid module",          desc:"Self-paced, covers all major scenarios" },
          { icon:"📖", name:"First aid guide book",             desc:"Quick reference for emergencies" },
          { icon:"🏥", name:"Vet-led home visit training",      desc:"Personalised to ${name}'s specific risks" },
        ],
      },
      step4:{
        title:`${name}'s First Aid Readiness Plan`,
        summaryFields:["Current kit","Scenarios to prep for","Training approach","Next step"],
        cta:"🩺 Hand to Concierge",
        conciergeNote:"Your Concierge will source the kit, book the training, and prepare the scenario-specific guides.",
      },
    },

    // ── PATH 4: INSURANCE & FINANCIAL ─────────────────────────
    {
      id:"insurance",
      icon:"🛡️",
      iconBg:"#E3F2FD", accentColor:"#1565C0", accentBg:"#E3F2FD",
      accentBorder:"#90CAF9", badgeBg:"#1565C0", badge: insured ? "Review cover" : "Get covered",
      photoBg:`linear-gradient(135deg,#E3F2FD,#BBDEFB)`,
      title:"Insurance & Financial Path",
      desc:`${insured ? `${name}'s insurance is active — let's make sure it's the right cover.` : `${name} isn't insured yet. Emergencies are expensive. Let's fix this.`}`,
      stepLabels:["Current financial situation","Insurance options","Emergency fund setup","Your financial protection plan"],
      miraNote:`Emergency vet bills in India average ₹15,000–₹80,000 for serious cases. ${insured ? `${name} is insured — but I want to make sure the cover is right for ${breed}s.` : `${name} isn't insured. This is the most important thing to fix.`}`,

      step1:{
        title:`${name}'s current financial situation`,
        desc:"Honest assessment — no judgement. Mira works with what's real.",
        type:"confirm_condition",
        confirmed: insured ? "Pet insurance active" : "No insurance yet",
        options:[
          "Pet insurance active — policy in place",
          "No insurance — considering it",
          "Insurance lapsed — need to renew",
          "Self-insuring — emergency savings in place",
        ],
      },
      step2:{
        title:"Insurance approach for your situation",
        desc:`Mira will find the right cover for ${name}'s breed, age and health history.`,
        type:"select_one",
        miraPick: insured ? "Policy review and optimisation" : "Full comprehensive cover",
        options:[
          { icon:"🔍", name:"Policy review and optimisation", desc:"Review existing cover — are all risks covered?",     mira:insured },
          { icon:"🛡️", name:"Full comprehensive cover",       desc:"Accidents, illness, surgery, hospitalisation",       mira:!insured },
          { icon:"⚡", name:"Accident-only cover",            desc:"Lower premium — covers sudden accidents only" },
          { icon:"💰", name:"Emergency fund setup",           desc:"Self-insurance — dedicated savings for ${name}'s care" },
        ],
      },
      step3:{
        title:"Emergency financial setup",
        desc:"Beyond insurance — financial preparation for emergencies.",
        type:"multi_select",
        options:[
          { icon:"📋", name:"Policy document organiser",     desc:"Claim number, policy number, emergency contact — in one card" },
          { icon:"💳", name:"Emergency card on file",         desc:"Credit/debit card designated for vet emergencies" },
          { icon:"📞", name:"Vet payment plans",              desc:"Know which vets offer payment plans before you need them" },
          { icon:"💰", name:"Monthly pet savings",            desc:"₹500/month dedicated to ${name}'s health" },
        ],
      },
      step4:{
        title:`${name}'s Financial Protection Plan`,
        summaryFields:["Current situation","Insurance approach","Emergency setup","Next step"],
        cta:"🛡️ Hand to Concierge",
        conciergeNote:"Your Concierge will compare insurance options, prepare the documents, and set up the claim procedure.",
      },
    },

    // ── PATH 5: EMERGENCY VET NETWORK ─────────────────────────
    {
      id:"vetnetwork",
      icon:"🏥",
      iconBg:"#FCE4EC", accentColor:"#C62828", accentBg:"#FCE4EC",
      accentBorder:"#F48FB1", badgeBg:G.crimson, badge:"Save now",
      photoBg:`linear-gradient(135deg,#FCE4EC,#F8BBD9)`,
      title:"Emergency Vet Network Path",
      desc:`Build ${name}'s emergency vet network before you need it — never waste time searching in a crisis.`,
      stepLabels:["Know your vets","After-hours options","Specialist access","Your vet network"],
      miraNote:`In an emergency, you have seconds to act, not minutes to search. Having the right vet numbers already saved — specifically 24-hour and specialist — can make the difference for ${name}.`,

      step1:{
        title:`${name}'s current vet situation`,
        desc:"Who do you call right now if something happens?",
        type:"multi_select",
        options:[
          { icon:"🏥", name:"Regular vet — number saved",          desc:"I know who to call during office hours" },
          { icon:"🌙", name:"24-hour vet — number saved",          desc:"For nights, weekends, emergencies", mira:true },
          { icon:"🔬", name:"Specialist vet — if needed",          desc:"Cardiologist, orthopaedic, oncology if relevant" },
          { icon:"📞", name:"Backup vet — in case regular is full", desc:"Second option when my usual vet can't take us" },
          { icon:"🚐", name:"Pet ambulance number",                 desc:"When I can't drive or need professional transport" },
        ],
      },
      step2:{
        title:"After-hours emergency options",
        desc:`24-hour vets nearest to ${name}'s home — Mira will find them.`,
        type:"select_one",
        miraPick:"Mira finds nearest 24hr vet",
        options:[
          { icon:"✦", name:"Mira finds nearest 24hr vet",          desc:"I'll locate the closest 24-hour clinic to you", mira:true },
          { icon:"🗺️", name:"I'll search myself",                  desc:"I want to do my own research" },
          { icon:"🏥", name:"I already have one saved",             desc:"Just need to save the backup" },
          { icon:"📱", name:"Set up vet app / on-demand vet",       desc:"Online vet for initial guidance before I drive" },
        ],
      },
      step3:{
        title:`Specialist access for ${name}`,
        desc:"Depending on breed and age, some specialists matter more than others.",
        type:"multi_select",
        options:[
          { icon:"❤️", name:"Cardiologist",    desc:`${breed}s can be prone to heart conditions — good to know who to call` },
          { icon:"🦴", name:"Orthopaedic vet", desc:"For fractures, hip dysplasia, ligament injuries" },
          { icon:"🧠", name:"Neurologist",     desc:"Seizures, spinal issues — especially relevant for some breeds" },
          { icon:"👁️", name:"Ophthalmologist", desc:"Eye injuries and conditions" },
          { icon:"🦷", name:"Dental specialist", desc:"For complex dental procedures beyond routine cleaning" },
        ],
      },
      step4:{
        title:`${name}'s Emergency Vet Network`,
        summaryFields:["Current vets on file","After-hours access","Specialists","Next step"],
        cta:"🏥 Hand to Concierge",
        conciergeNote:"Your Concierge will find the nearest 24-hour vets, save the numbers, and create your emergency vet card.",
      },
    },
  ];
}

// ─── SHARED COMPONENTS (same as GuidedCarePaths) ─────────────
function StepIndicator({ steps, currentStep, completedSteps, accentColor }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, marginBottom:24 }}>
      {steps.map((label, i) => {
        const stepNum    = i + 1;
        const isComplete = completedSteps.includes(stepNum);
        const isCurrent  = currentStep === stepNum;
        const isPending  = !isComplete && !isCurrent;
        return (
          <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background: isComplete || isCurrent ? accentColor : "#E0D8D0", color: isComplete || isCurrent ? "#fff" : "#999", display:"flex", alignItems:"center", justifyContent:"center", fontSize: isComplete ? 14 : 13, fontWeight:700, transition:"all 0.2s" }}>
                {isComplete ? "✓" : stepNum}
              </div>
              {i < steps.length - 1 && <div style={{ width:2, height:28, background: isComplete ? accentColor : "#E0D8D0", transition:"background 0.3s" }}/>}
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

function OptionRow({ option, selected, onSelect, accentColor }) {
  return (
    <div onClick={() => onSelect(option.name || option)} style={{ background: selected ? `${accentColor}10` : "#fff", border:`1.5px solid ${selected ? accentColor : "#F0E8E0"}`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"all 0.12s", marginBottom:6 }}>
      {option.icon && <span style={{ fontSize:24, flexShrink:0 }}>{option.icon}</span>}
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
          <span style={{ fontSize:14, fontWeight:700, color:"#1A0A00" }}>{option.name || option}</span>
          {option.mira && <span style={{ background:`${accentColor}18`, color:accentColor, fontSize:10, fontWeight:700, borderRadius:20, padding:"1px 7px" }}>★ Mira's pick</span>}
        </div>
        {option.desc && <div style={{ fontSize:12, color:"#888" }}>{(option.desc || "").replace("${name}", option.name)}</div>}
      </div>
      {selected && <div style={{ width:22, height:22, borderRadius:"50%", background:accentColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700, flexShrink:0 }}>✓</div>}
    </div>
  );
}

function ModalShell({ onClose, children, noPadding }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.50)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius:20, width:"min(720px,100%)", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.20)", padding: noPadding ? 0 : "28px 28px 24px", border:"2px solid #F0E8E0" }}>
        {children}
      </div>
    </div>
  );
}

function PathFlowModal({ path, pet, onClose }) {
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
      setSelections(prev => ({ ...prev, step1:[val] }));
    } else {
      setSelections(prev => { const cur=prev.step1; return { ...prev, step1: cur.includes(val) ? cur.filter(v=>v!==val) : [...cur,val] }; });
    }
  };
  const handleSel2 = (val) => setSelections(prev => ({ ...prev, step2:val }));
  const handleSel3 = (val) => {
    setSelections(prev => {
      const cur = prev.step3;
      if (path.step3.type === "select_one") return { ...prev, step3:[val] };
      return { ...prev, step3: cur.includes(val) ? cur.filter(v=>v!==val) : [...cur,val] };
    });
  };
  const handleSubmit = () => setSubmitted(true); // TODO: POST /api/concierge/emergency-path

  if (submitted) return (
    <ModalShell onClose={onClose} noPadding>
      <div style={{ background:`linear-gradient(135deg,${G.deep},${G.mid})`, borderRadius:20, padding:"48px 40px", textAlign:"center", minHeight:320, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:`linear-gradient(135deg,${path.accentColor},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:20 }}>♥</div>
        <div style={{ fontSize:22, fontWeight:800, color:"#fff", fontFamily:"Georgia,serif", marginBottom:10 }}>{path.title.replace(" Path","")} sent to your Concierge.</div>
        <div style={{ fontSize:14, color:"rgba(255,255,255,0.55)", marginBottom:28, lineHeight:1.6 }}>Everything is in good hands.<br/>Your Concierge will reach out within 2 hours. ♥</div>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.20)", color:"#fff", borderRadius:20, padding:"10px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Done</button>
      </div>
    </ModalShell>
  );

  if (currentStep === 4 && completedSteps.includes(3)) {
    const summaryData = {
      [path.step4.summaryFields[0]]: selections.step1.join(", ") || "Not specified",
      [path.step4.summaryFields[1]]: selections.step2 || "Not selected",
      [path.step4.summaryFields[2]]: selections.step3.join(", ") || "Not selected",
      [path.step4.summaryFields[3]]: "Concierge will contact within 2h",
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
            <div key={k} style={{ display:"flex", alignItems:"flex-start", padding:"14px 18px", borderBottom: i < Object.entries(summaryData).length-1 ? "1px solid #F5F0EA" : "none" }}>
              <div style={{ fontSize:13, fontWeight:700, color:path.accentColor, width:160, flexShrink:0 }}>{k}</div>
              <div style={{ fontSize:13, color:"#1A0A00", flex:1, lineHeight:1.5 }}>{v}</div>
            </div>
          ))}
        </div>
        <button onClick={handleSubmit} style={{ width:"100%", background:`linear-gradient(135deg,${path.accentColor},${G.mid})`, color:"#fff", border:"none", borderRadius:14, padding:"16px", fontSize:16, fontWeight:800, cursor:"pointer", marginBottom:10 }}>
          {path.step4.cta}
        </button>
        <div style={{ fontSize:12, color:"#888", textAlign:"center" }}>{path.step4.conciergeNote}</div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:10, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{path.icon}</div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:"#1A0A00", fontFamily:"Georgia,serif" }}>{path.title.replace(" Path", ` for ${pet.name}`)}</div>
            <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{totalSteps} steps. One complete emergency plan.</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background:"#F5F5F5", border:"none", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:600, color:"#555", cursor:"pointer" }}>Close</button>
      </div>

      <div style={{ background:`${path.accentColor}12`, border:`1px solid ${path.accentColor}30`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:10, marginBottom:22 }}>
        <div style={{ width:28, height:28, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0 }}>✦</div>
        <div>
          <div style={{ fontSize:13, color:"#1A0A00", fontStyle:"italic", lineHeight:1.55 }}>{path.miraNote}</div>
          <div style={{ fontSize:11, color:path.accentColor, fontWeight:600, marginTop:3 }}>♥ Mira knows {pet.name}</div>
        </div>
      </div>

      <StepIndicator steps={path.stepLabels} currentStep={currentStep} completedSteps={completedSteps} accentColor={path.accentColor}/>

      {currentStep === 1 && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step1.title}</div>
          <div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step1.desc}</div>
          {path.step1.type === "multi_select" ? (
            <>
              {path.step1.options.map(opt => <OptionRow key={opt.name||opt} option={opt} selected={selections.step1.includes(opt.name||opt)} onSelect={handleSel1} accentColor={path.accentColor}/>)}
              <button onClick={() => selections.step1.length > 0 && completeStep(1)} style={{ marginTop:8, background: selections.step1.length > 0 ? `linear-gradient(135deg,${path.accentColor},${G.mid})` : "#E0D8D0", color: selections.step1.length > 0 ? "#fff" : "#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor: selections.step1.length > 0 ? "pointer" : "not-allowed" }}>Confirm →</button>
            </>
          ) : (
            <>
              {path.step1.options.map(opt => <OptionRow key={opt.name||opt} option={typeof opt==="string"?{name:opt}:opt} selected={selections.step1.includes(opt.name||opt)||(opt.name||opt)===path.step1.confirmed} onSelect={handleSel1} accentColor={path.accentColor}/>)}
              <button onClick={() => { if(!selections.step1.length && path.step1.confirmed) setSelections(prev=>({...prev,step1:[path.step1.confirmed]})); completeStep(1); }} style={{ marginTop:8, background:`linear-gradient(135deg,${path.accentColor},${G.mid})`, color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Confirm →</button>
            </>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step2.title}</div>
          <div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step2.desc}</div>
          {path.step2.options.map(opt => <OptionRow key={opt.name} option={opt} selected={selections.step2===opt.name} onSelect={handleSel2} accentColor={path.accentColor}/>)}
          <button onClick={() => selections.step2 && completeStep(2)} style={{ marginTop:8, background: selections.step2 ? `linear-gradient(135deg,${path.accentColor},${G.mid})` : "#E0D8D0", color: selections.step2 ? "#fff" : "#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor: selections.step2 ? "pointer" : "not-allowed" }}>Confirm →</button>
        </div>
      )}

      {currentStep === 3 && (
        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step3.title}</div>
          <div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step3.desc}</div>
          {path.step3.options.map(opt => <OptionRow key={opt.name} option={opt} selected={selections.step3.includes(opt.name)} onSelect={handleSel3} accentColor={path.accentColor}/>)}
          <button onClick={() => selections.step3.length > 0 && completeStep(3)} style={{ marginTop:8, background: selections.step3.length > 0 ? `linear-gradient(135deg,${path.accentColor},${G.mid})` : "#E0D8D0", color: selections.step3.length > 0 ? "#fff" : "#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor: selections.step3.length > 0 ? "pointer" : "not-allowed" }}>
            See {pet.name}'s Plan →
          </button>
        </div>
      )}
    </ModalShell>
  );
}

// ─── EXPORT ──────────────────────────────────────────────────
export default function GuidedEmergencyPaths({ pet }) {
  const [openPath,   setOpenPath]   = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [showAll,    setShowAll]    = useState(false);

  const allPaths = buildPaths(pet);
  const paths    = showAll ? allPaths : allPaths.slice(0, 3);
  const petName  = pet?.name || "your dog";

  return (
    <div style={{ marginBottom:32 }}>
      {activePath && (
        <PathFlowModal
          path={allPaths.find(p => p.id === activePath)}
          pet={pet}
          onClose={() => setActivePath(null)}
        />
      )}

      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:4 }}>
        <div style={{ fontSize:20, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif" }}>Guided Emergency Paths</div>
        <button onClick={() => setShowAll(!showAll)} style={{ background:"none", border:`1.5px solid ${G.light}`, borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:600, color:G.crimson, cursor:"pointer" }}>
          {showAll ? "Show less" : `See all ${allPaths.length}`}
        </button>
      </div>
      <div style={{ fontSize:12, color:G.mutedText, marginBottom:18 }}>
        {allPaths.length} emergency preparedness paths for {petName}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {paths.map(path => (
          <div key={path.id}>
            <div onClick={() => setOpenPath(openPath === path.id ? null : path.id)} style={{ background: openPath === path.id ? path.accentBg : "#fff", border:`1.5px solid ${openPath === path.id ? path.accentBorder : "#F0E8E0"}`, borderRadius: openPath === path.id ? "14px 14px 0 0" : 14, cursor:"pointer", overflow:"hidden", transition:"all 0.15s" }}>
              {openPath !== path.id && (
                <div style={{ height:64, background:path.photoBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:32, opacity:0.75 }}>{path.icon}</span>
                </div>
              )}
              <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{path.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:"#1A0A00" }}>{path.title}</span>
                    <span style={{ background:path.badgeBg, color:"#fff", fontSize:10, fontWeight:700, borderRadius:20, padding:"2px 8px" }}>{path.badge}</span>
                  </div>
                  <div style={{ fontSize:12, color:"#555", lineHeight:1.5 }}>{path.desc}</div>
                </div>
                <span style={{ fontSize:16, color:"#ccc", flexShrink:0, transform: openPath === path.id ? "rotate(90deg)" : "none", transition:"transform 0.2s" }}>›</span>
              </div>
            </div>

            {openPath === path.id && (
              <div style={{ background:"#fff", border:`1.5px solid ${path.accentBorder}`, borderTop:"none", borderRadius:"0 0 14px 14px", padding:"16px 18px 20px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:path.accentColor, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Path Steps</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18 }}>
                  {path.stepLabels.map((label, i) => (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:26, height:26, borderRadius:"50%", border:`1.5px solid ${path.accentColor}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:path.accentColor, flexShrink:0 }}>{i+1}</div>
                      <span style={{ fontSize:13, color:"#1A0A00" }}>{label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setOpenPath(null); setActivePath(path.id); }} style={{ width:"100%", background:path.accentColor, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                  Start this path with Mira →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
