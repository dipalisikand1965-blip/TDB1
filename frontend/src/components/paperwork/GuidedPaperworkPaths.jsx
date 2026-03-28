/**
 * GuidedPaperworkPaths.jsx — /paperwork pillar
 * The Doggy Company
 *
 * 5 PATHS:
 *   1. Document Safety Path     — get all core documents in order
 *   2. Insurance Setup Path     — right cover, right policy
 *   3. Travel Readiness Path    — pet passport + health cert + airline requirements
 *   4. Identity & Registration  — microchip + ID tag + society registration
 *   5. Health Records Path      — vaccination, medical history, vet records
 *
 * HOW TO USE:
 *   import GuidedPaperworkPaths from "../components/paperwork/GuidedPaperworkPaths";
 *   <GuidedPaperworkPaths pet={petData} />
 *
 * WIRING: POST /api/concierge/paperwork-path
 */
import { useState, useEffect } from 'react';
import { guidedPathComplete } from "../../utils/MiraCardActions";

const G = { deep:"#1E293B", mid:"#334155", teal:"#0D9488", light:"#99F6E4", pale:"#F0FDFA", cream:"#F8FAFC", darkText:"#1E293B", mutedText:"#475569" };
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

export function buildPaths(pet) {
  const name    = pet?.name || "your dog";
  const breed   = pet?.breed || pet?.doggy_soul_answers?.breed || "your breed";
  const insured = !!(pet?.doggy_soul_answers?.insurance);
  const chipped = !!(pet?.doggy_soul_answers?.microchipped);
  const vaccinated = !!(pet?.vaccinated);

  return [
    {
      id:"document_safety",
      icon:"📋", iconBg:"#F0FDFA", accentColor:G.teal, accentBg:"#F0FDFA", accentBorder:"#99F6E4",
      badgeBg:G.teal, badge:"Start here",
      photoBg:"linear-gradient(135deg,#F0FDFA,#CCFBF1)",
      title:"Document Safety Path",
      desc:`Get all of ${name}'s essential documents organised, safe, and accessible in one complete audit.`,
      stepLabels:["Document audit","What's missing","Organise & store","Your document plan"],
      miraNote:`A complete document audit tells us exactly where ${name} stands — and what to fix first. Most families are missing 2-3 critical documents without realising it.`,
      step1:{
        title:`What documents does ${name} have right now?`,
        desc:"Honest check — tick everything that's actually accessible (not just 'somewhere at home').",
        type:"multi_select",
        options:[
          { icon:"💉", name:"Vaccination certificate",         desc:"Accessible + up to date",    mira:vaccinated },
          { icon:"🔬", name:"Microchip registration cert",    desc:"Registry certificate on file", mira:chipped },
          { icon:"📋", name:"Pet insurance policy",            desc:"Policy number accessible",    mira:insured },
          { icon:"🏛️", name:"Society/municipal registration", desc:"Compliance letter if required" },
          { icon:"✈️", name:"Pet passport",                   desc:"For international travel" },
          { icon:"🏥", name:"Health & medical records",       desc:"Vet records, surgery history, medications" },
        ],
      },
      step2:{
        title:"Priority documents to get in order",
        desc:`Mira will focus on these first — the documents that matter most for ${name}'s safety and legal compliance.`,
        type:"select_one",
        miraPick: !chipped ? "Microchip registration — most urgent" : !vaccinated ? "Vaccination records — most urgent" : "Full document audit",
        options:[
          { icon:"🔬", name:"Microchip registration — most urgent",  desc:"Permanent ID — most important single document",    mira:!chipped },
          { icon:"💉", name:"Vaccination records — most urgent",     desc:"Required for boarding, travel, kennels",            mira:!vaccinated },
          { icon:"📋", name:"Insurance policy",                      desc:"Financial protection for emergencies" },
          { icon:"📦", name:"Full document audit",                   desc:"Everything at once — Concierge® handles all of it", mira:chipped && vaccinated },
        ],
      },
      step3:{
        title:"How would you like to store the documents?",
        desc:"The best system is the one you'll actually use. Mira will set it up for you.",
        type:"multi_select",
        options:[
          { icon:"📁", name:"Waterproof physical folder",    desc:"All originals in one place — for emergencies" },
          { icon:"☁️", name:"Digital cloud backup",         desc:"Scanned copies accessible anywhere" },
          { icon:"💳", name:"Emergency reference card",      desc:"Key numbers on a laminated card — in your wallet", mira:true },
          { icon:"📱", name:"Pet health app",                desc:"All records in one app — shareable with vets" },
        ],
      },
      step4:{
        title:`${name}'s Document Safety Plan`,
        summaryFields:["Current documents","Priority gaps","Storage system","Next step"],
        cta:"📋 Hand to Concierge®",
        conciergeNote:"Your Concierge® will audit, organise and set up the complete document system for you.",
      },
    },
    {
      id:"insurance_setup",
      icon:"🛡️", iconBg:"#E3F2FD", accentColor:"#1565C0", accentBg:"#E3F2FD", accentBorder:"#90CAF9",
      badgeBg:"#1565C0", badge: insured ? "Review cover" : "Get covered",
      photoBg:"linear-gradient(135deg,#E3F2FD,#BBDEFB)",
      title:"Insurance Setup Path",
      desc:`${insured ? `Review and optimise ${name}'s current cover.` : `Get ${name} the right insurance — Mira compares and finds the best fit.`}`,
      stepLabels:["Current situation","Coverage type","Policy setup","Your insurance plan"],
      miraNote:`Pet insurance is most affordable when started young. ${insured?`${name} is insured — but I want to make sure the cover matches ${breed}'s specific health risks.`:`${name} isn't insured yet. An uncovered emergency vet bill can be overwhelming. Let me find the right policy.`}`,
      step1:{
        title:`${name}'s insurance situation`,
        desc:"Confirm the current state — Mira will build from here.",
        type:"confirm_condition",
        confirmed: insured ? "Pet insurance active" : "No insurance yet",
        options:["Pet insurance active — policy in place","No insurance — need to start","Insurance lapsed — need renewal","Looking to switch providers"],
      },
      step2:{
        title:`Type of cover for ${name}`,
        desc:"Different cover types suit different situations. Mira will match to breed risk profile.",
        type:"select_one",
        miraPick:"Comprehensive — accidents + illness",
        options:[
          { icon:"🛡️", name:"Comprehensive — accidents + illness", desc:"Full cover including surgery, hospitalisation, chronic illness", mira:true },
          { icon:"⚡", name:"Accident-only",                        desc:"Lower premium — sudden accidents only, no illness" },
          { icon:"🔍", name:"Policy review",                        desc:"Keep existing cover but review for gaps",                       mira:insured },
          { icon:"💰", name:"Top-up cover",                         desc:"Add cover on top of existing policy" },
        ],
      },
      step3:{
        title:"Policy setup and documentation",
        desc:"Once the right policy is chosen — Mira handles the admin.",
        type:"multi_select",
        options:[
          { icon:"📋", name:"Policy document organiser", desc:"Policy number, claim line, renewal date — all in one card", mira:true },
          { icon:"📱", name:"Claim process walkthrough",  desc:"Know exactly how to file before you need to" },
          { icon:"📅", name:"Renewal reminders",          desc:"Set automatic reminders — never lapse accidentally" },
          { icon:"🏥", name:"Vet payment plan setup",     desc:"Know which vets offer payment plans as a backup" },
        ],
      },
      step4:{
        title:`${name}'s Insurance Plan`,
        summaryFields:["Current situation","Cover type","Documentation","Next step"],
        cta:"🛡️ Hand to Concierge®",
        conciergeNote:"Your Concierge® will compare policies, find the best fit for the breed, and handle all the paperwork.",
      },
    },
    {
      id:"travel_readiness",
      icon:"✈️", iconBg:"#F3E5F5", accentColor:"#7B1FA2", accentBg:"#F3E5F5", accentBorder:"#CE93D8",
      badgeBg:"#7B1FA2", badge:"Travel ready",
      photoBg:"linear-gradient(135deg,#F3E5F5,#E1BEE7)",
      title:"Travel Readiness Path",
      desc:`Everything ${name} needs to travel — domestically or internationally — arranged and verified.`,
      stepLabels:["Travel plans","Destination requirements","Document preparation","Your travel readiness plan"],
      miraNote:`Pet travel requirements vary dramatically by country and airline. Getting it wrong means ${name} can't board. I'll make sure every document is right, verified and in the correct format.`,
      step1:{
        title:`Where is ${name} travelling?`,
        desc:"The requirements differ completely — domestic vs international, airline vs rail.",
        type:"select_one",
        miraPick:"International — most documentation needed",
        options:[
          { icon:"🌍", name:"International — most documentation needed", desc:"Pet passport, health cert, rabies titre, country permits", mira:true },
          { icon:"✈️", name:"Domestic flight within India",              desc:"Health certificate, carrier approval, airline clearance" },
          { icon:"🚂", name:"Train travel within India",                  desc:"Booking process, health cert, carrier requirements" },
          { icon:"🏨", name:"Staying at a hotel or Airbnb",              desc:"Documentation for pet-friendly properties" },
        ],
      },
      step2:{
        title:"Destination-specific requirements",
        desc:"Mira will verify the exact requirements for the destination.",
        type:"multi_select",
        options:[
          { icon:"📘", name:"Pet passport",              desc:"Required for international travel — Mira arranges", mira:true },
          { icon:"📋", name:"Health certificate",        desc:"Valid for 10 days of travel — vet-issued" },
          { icon:"💉", name:"Rabies titre blood test",   desc:"Required for certain countries — 6+ months notice" },
          { icon:"📄", name:"Import/export permits",     desc:"Country-specific documentation" },
          { icon:"✈️", name:"Airline cargo clearance",  desc:"For dogs travelling in cargo hold" },
        ],
      },
      step3:{
        title:"Travel kit and documentation system",
        desc:`Everything in one waterproof folder — so every document is accessible when needed.`,
        type:"multi_select",
        options:[
          { icon:"📁", name:"Travel document folder",    desc:"Waterproof A5 folder for all travel documents", mira:true },
          { icon:"💊", name:"Medication travel letter",  desc:"Vet-signed letter for prescribed medications" },
          { icon:"🎒", name:"In-cabin carry checklist",  desc:"Carrier, food, water, documents, collar with tag" },
          { icon:"📞", name:"Destination vet contacts",  desc:"Emergency vet at destination — saved before you go" },
        ],
      },
      step4:{
        title:`${name}'s Travel Readiness Plan`,
        summaryFields:["Travel destination","Required documents","Travel kit","Next step"],
        cta:"✈️ Hand to Concierge®",
        conciergeNote:"Your Concierge® will get every document verified, book vet appointments for certificates, and create the complete travel kit.",
      },
    },
    {
      id:"identity_registration",
      icon:"🪪", iconBg:"#E0F2F1", accentColor:G.teal, accentBg:"#E0F2F1", accentBorder:"#80CBC4",
      badgeBg:G.teal, badge: chipped ? "Review ID" : "Register now",
      photoBg:"linear-gradient(135deg,#E0F2F1,#B2DFDB)",
      title:"Identity & Registration Path",
      desc:`Permanent ID, legal registration, and complete identity protection for ${name} — starting with the microchip.`,
      stepLabels:["Current ID status","Registration requirements","ID tag setup","Your identity plan"],
      miraNote:`${chipped?`${name} is microchipped — excellent. Let's make sure the registration is current and the ID tag is properly set up.`:`${name}'s microchip isn't registered yet. This is the single most important thing for permanent identity — a collar can fall off, a chip cannot.`}`,
      step1:{
        title:`${name}'s current identity and registration`,
        desc:"Check what's in place — and what still needs attention.",
        type:"multi_select",
        options:[
          { icon:"🔬", name:"Microchip — registered",         desc:"Chip implanted AND registry entry complete", mira:chipped },
          { icon:"🏷️", name:"ID tag on collar",               desc:"Name, owner number, vet number on collar tag" },
          { icon:"🏛️", name:"Municipal registration",          desc:"Local authority dog registration if required" },
          { icon:"🏢", name:"Housing society registration",   desc:"Society NOC and pet registration if applicable" },
          { icon:"📋", name:"KCI/breed registration",         desc:"For pedigree dogs with breed papers" },
        ],
      },
      step2:{
        title:"Registration requirements for your area",
        desc:"Requirements vary by city and housing type. Mira will check what applies.",
        type:"select_one",
        miraPick:"Apartment/housing society",
        options:[
          { icon:"🏢", name:"Apartment/housing society",    desc:"Society NOC, vaccination proof, registration form", mira:true },
          { icon:"🏠", name:"Independent house",            desc:"Municipal registration if required in your city" },
          { icon:"📋", name:"Pedigree registration (KCI)", desc:"Breed certificate, pedigree papers, club membership" },
          { icon:"🌍", name:"International registration",   desc:"For dogs with registrations in multiple countries" },
        ],
      },
      step3:{
        title:`${name}'s ID tag setup`,
        desc:"The ID tag is the first thing found on a lost dog. Get it right.",
        type:"multi_select",
        options:[
          { icon:"🏷️", name:"Engraved collar tag",           desc:"Name, phone number, vet number — permanent", mira:true },
          { icon:"📱", name:"QR code tag",                   desc:"Scan to see ${name}'s full profile and contacts" },
          { icon:"🔬", name:"Medical alert tag",             desc:"Breed, conditions, medications — vital for emergencies" },
          { icon:"📋", name:"Emergency info card in wallet", desc:"Card for you — ${name}'s info if you're incapacitated" },
        ],
      },
      step4:{
        title:`${name}'s Identity Plan`,
        summaryFields:["Current ID status","Registration needed","ID setup","Next step"],
        cta:"🪪 Hand to Concierge®",
        conciergeNote:"Your Concierge® will arrange microchip registration, society paperwork, and order the ID tag set.",
      },
    },
    {
      id:"health_records",
      icon:"🏥", iconBg:"#E8F5E9", accentColor:"#2E7D32", accentBg:"#E8F5E9", accentBorder:"#A5D6A7",
      badgeBg:"#2E7D32", badge: vaccinated ? "Keep current" : "Update records",
      photoBg:"linear-gradient(135deg,#E8F5E9,#C8E6C9)",
      title:"Health Records Path",
      desc:`Organise ${name}'s complete health history — vaccinations, vet records, medications, surgery history.`,
      stepLabels:["Health records audit","What needs updating","Records system","Your health records plan"],
      miraNote:`${vaccinated?`${name}'s vaccinations are up to date — great start. Let's make sure the full health record is complete and accessible.`:`${name}'s vaccination status needs attention. Boarding, travel and many services require up-to-date vaccination certificates.`}`,
      step1:{
        title:`${name}'s health records — what's current?`,
        desc:"Check what's accessible and up to date.",
        type:"multi_select",
        options:[
          { icon:"💉", name:"Vaccination certificate — current",    desc:"All core vaccines up to date and documented", mira:vaccinated },
          { icon:"🦠", name:"Deworming record",                      desc:"Last treatment date and product" },
          { icon:"🦟", name:"Anti-parasite treatment",               desc:"Flea, tick, heartworm prevention on record" },
          { icon:"🏥", name:"Vet visit history",                     desc:"All consultations and diagnoses on file" },
          { icon:"💊", name:"Current medications",                   desc:"Active prescriptions with dosage and frequency" },
          { icon:"🏋️", name:"Surgical/procedure history",           desc:"Any surgeries, dental work, hospitalisations" },
        ],
      },
      step2:{
        title:"What needs to be updated or collected",
        desc:"Mira will prioritise these by urgency and impact.",
        type:"select_one",
        miraPick: !vaccinated ? "Vaccination records — most urgent" : "Complete health history collection",
        options:[
          { icon:"💉", name:"Vaccination records — most urgent",       desc:"Required for boarding, travel, most services", mira:!vaccinated },
          { icon:"📋", name:"Complete health history collection",       desc:"Collect all records from all previous vets", mira:vaccinated },
          { icon:"💊", name:"Current medication documentation",         desc:"Prescription letters and dosage records" },
          { icon:"🩺", name:"Annual wellness records",                  desc:"Set up annual check schedule and record system" },
        ],
      },
      step3:{
        title:`Health records system for ${name}`,
        desc:"The right system means the right information is always accessible — especially in emergencies.",
        type:"multi_select",
        options:[
          { icon:"📁", name:"Medical history binder",      desc:"A4 binder with tabbed sections — complete physical record", mira:true },
          { icon:"📋", name:"Vaccination card organiser",  desc:"A5 waterproof folder for all vaccination certificates" },
          { icon:"💊", name:"Medication tracker pad",      desc:"Daily log — time, dose, reaction notes" },
          { icon:"☁️", name:"Digital health record backup", desc:"Scanned copies accessible from phone" },
        ],
      },
      step4:{
        title:`${name}'s Health Records Plan`,
        summaryFields:["Current records","What to update","Records system","Next step"],
        cta:"🏥 Hand to Concierge®",
        conciergeNote:"Your Concierge® will collect records from all vets, organise the system, and set up the vaccination reminder schedule.",
      },
    },
  ];
}

// ─── SHARED COMPONENTS ───────────────────────────────────────
function StepIndicator({ steps, currentStep, completedSteps, accentColor }) {
  return (<div style={{ display:"flex", flexDirection:"column", gap:0, marginBottom:24 }}>{steps.map((label, i) => { const stepNum=i+1, isComplete=completedSteps.includes(stepNum), isCurrent=currentStep===stepNum, isPending=!isComplete&&!isCurrent; return (<div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14 }}><div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}><div style={{ width:32, height:32, borderRadius:"50%", background:isComplete||isCurrent?accentColor:"#E0D8D0", color:isComplete||isCurrent?"#fff":"#999", display:"flex", alignItems:"center", justifyContent:"center", fontSize:isComplete?14:13, fontWeight:700, transition:"all 0.2s" }}>{isComplete?"✓":stepNum}</div>{i<steps.length-1&&<div style={{ width:2, height:28, background:isComplete?accentColor:"#E0D8D0", transition:"background 0.3s" }}/>}</div><div style={{ paddingTop:6, paddingBottom:i<steps.length-1?28:16, fontSize:14, fontWeight:isCurrent?700:400, color:isPending?"#BBB":"#1A0A00" }}>{label}{isComplete&&<span style={{ marginLeft:10, fontSize:11, fontWeight:600, color:accentColor, background:`${accentColor}18`, borderRadius:20, padding:"1px 8px" }}>✓ Done</span>}</div></div>); })}</div>);
}

function OptionRow({ option, selected, onSelect, accentColor }) {
  return (<div onClick={() => onSelect(option.name||option)} style={{ background:selected?`${accentColor}10`:"#fff", border:`1.5px solid ${selected?accentColor:"#F0E8E0"}`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"all 0.12s", marginBottom:6 }}>{option.icon&&<span style={{ fontSize:24, flexShrink:0 }}>{option.icon}</span>}<div style={{ flex:1 }}><div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}><span style={{ fontSize:14, fontWeight:700, color:"#1A0A00" }}>{option.name||option}</span>{option.mira&&<span style={{ background:`${accentColor}18`, color:accentColor, fontSize:10, fontWeight:700, borderRadius:20, padding:"1px 7px" }}>★ Mira's pick</span>}</div>{option.desc&&<div style={{ fontSize:12, color:"#888" }}>{option.desc}</div>}</div>{selected&&<div style={{ width:22, height:22, borderRadius:"50%", background:accentColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700, flexShrink:0 }}>✓</div>}</div>);
}

function ModalShell({ onClose, children, noPadding }) {
  return (<div onClick={onClose} data-testid="paperwork-pathflow-backdrop" style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.78)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}><div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:20, width:"min(720px,100%)", maxHeight:"90vh", overflowY:"auto", scrollbarWidth:"none", msOverflowStyle:"none", boxShadow:"0 24px 80px rgba(0,0,0,0.35)", padding:noPadding?0:"28px 28px 24px", border:"2px solid #F0E8E0" }}>{children}</div></div>);
}

export function PathFlowModal({ path, pet, onClose }) {
  const [currentStep,setCurrentStep]=useState(1); const [completedSteps,setCompletedSteps]=useState([]); const [selections,setSelections]=useState({step1:[],step2:null,step3:[],step4:null}); const [submitted,setSubmitted]=useState(false);
  const totalSteps=4;
  const completeStep=(step)=>{ if(!completedSteps.includes(step))setCompletedSteps(prev=>[...prev,step]); if(step<totalSteps)setCurrentStep(step+1); };
  const handleSel1=(val)=>{ if(path.step1.type==="confirm_condition"){setSelections(prev=>({...prev,step1:[val]}));}else{setSelections(prev=>{const cur=prev.step1;return{...prev,step1:cur.includes(val)?cur.filter(v=>v!==val):[...cur,val]};});}};
  const handleSel2=(val)=>setSelections(prev=>({...prev,step2:val}));
  const handleSel3=(val)=>setSelections(prev=>{const cur=prev.step3;if(path.step3.type==="select_one")return{...prev,step3:[val]};return{...prev,step3:cur.includes(val)?cur.filter(v=>v!==val):[...cur,val]};});
  const handleSubmit = () => {
    guidedPathComplete({ pathTitle: path?.title || "Paperwork Path", pillar: "paperwork", pet, channel: "paperwork_guided_paths_complete", onSuccess: () => setSubmitted(true) });
    setSubmitted(true);
  }; // POST /api/concierge/paperwork-path

  if(submitted)return(<ModalShell onClose={onClose} noPadding><div style={{ background:`linear-gradient(135deg,${G.deep},${G.mid})`, borderRadius:20, padding:"48px 40px", textAlign:"center", minHeight:320, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}><div style={{ width:64, height:64, borderRadius:"50%", background:`linear-gradient(135deg,${path.accentColor},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:20 }}>♥</div><div style={{ fontSize:22, fontWeight:800, color:"#fff", fontFamily:"Georgia,serif", marginBottom:10 }}>{path.title.replace(" Path","")} sent to your Concierge®.</div><div style={{ fontSize:14, color:"rgba(255,255,255,0.55)", marginBottom:28, lineHeight:1.6 }}>Everything is in good hands.<br/>Your Concierge® will reach out within 48 hours. ♥</div><button onClick={onClose} data-testid="paperwork-pathflow-done-button" style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.20)", color:"#fff", borderRadius:20, padding:"10px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Done</button></div></ModalShell>);

  if(currentStep===4&&completedSteps.includes(3)){
    const summaryData={[path.step4.summaryFields[0]]:selections.step1.join(", ")||"Not specified",[path.step4.summaryFields[1]]:selections.step2||"Not selected",[path.step4.summaryFields[2]]:selections.step3.join(", ")||"Not selected",[path.step4.summaryFields[3]]:"Concierge® will contact within 48h"};
    return(<ModalShell onClose={onClose}><div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}><div style={{ width:44, height:44, borderRadius:10, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{path.icon}</div><div><div style={{ fontSize:17, fontWeight:800, color:"#1A0A00", fontFamily:"Georgia,serif" }}>{path.title.replace(" Path",` for ${pet.name}`)}</div><div style={{ fontSize:12, color:"#888", marginTop:2 }}>{path.step4.summaryFields.join(" · ")} · All confirmed</div></div><button onClick={onClose} data-testid="paperwork-pathflow-close-button" style={{ marginLeft:"auto", background:"#F5F5F5", border:"none", borderRadius:"50%", width:32, height:32, fontSize:16, cursor:"pointer", color:"#555" }}>✕</button></div><div style={{ background:"#fff", border:"1px solid #F0E8E0", borderRadius:14, marginBottom:20, overflow:"hidden" }}>{Object.entries(summaryData).map(([k,v],i)=>(<div key={k} style={{ display:"flex", alignItems:"flex-start", padding:"14px 18px", borderBottom:i<Object.entries(summaryData).length-1?"1px solid #F5F0EA":"none" }}><div style={{ fontSize:13, fontWeight:700, color:path.accentColor, width:160, flexShrink:0 }}>{k}</div><div style={{ fontSize:13, color:"#1A0A00", flex:1, lineHeight:1.5 }}>{v}</div></div>))}</div><button onClick={handleSubmit} data-testid="paperwork-pathflow-submit-button" style={{ width:"100%", background:`linear-gradient(135deg,${path.accentColor},${G.mid})`, color:"#fff", border:"none", borderRadius:14, padding:"16px", fontSize:16, fontWeight:800, cursor:"pointer", marginBottom:10 }}>{path.step4.cta}</button><div style={{ fontSize:12, color:"#888", textAlign:"center" }}>{path.step4.conciergeNote}</div></ModalShell>);
  }

  return(<ModalShell onClose={onClose}><div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}><div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ width:44, height:44, borderRadius:10, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{path.icon}</div><div><div style={{ fontSize:17, fontWeight:800, color:"#1A0A00", fontFamily:"Georgia,serif" }}>{path.title.replace(" Path",` for ${pet.name}`)}</div><div style={{ fontSize:12, color:"#888", marginTop:2 }}>{totalSteps} steps. One complete plan.</div></div></div><button onClick={onClose} data-testid="paperwork-pathflow-dismiss-button" style={{ background:"#F5F5F5", border:"none", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:600, color:"#555", cursor:"pointer" }}>Close</button></div>
  <div style={{ background:`${path.accentColor}12`, border:`1px solid ${path.accentColor}30`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:10, marginBottom:22 }}><div style={{ width:28, height:28, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0 }}>✦</div><div><div style={{ fontSize:13, color:"#1A0A00", fontStyle:"italic", lineHeight:1.55 }}>{path.miraNote}</div><div style={{ fontSize:11, color:path.accentColor, fontWeight:600, marginTop:3 }}>♥ Mira knows {pet.name}</div></div></div>
  <StepIndicator steps={path.stepLabels} currentStep={currentStep} completedSteps={completedSteps} accentColor={path.accentColor}/>
  {currentStep===1&&(<div><div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step1.title}</div><div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step1.desc}</div>{path.step1.type==="multi_select"?(<>{path.step1.options.map(opt=><OptionRow key={opt.name||opt} option={opt} selected={selections.step1.includes(opt.name||opt)} onSelect={handleSel1} accentColor={path.accentColor}/>)}<button onClick={()=>selections.step1.length>0&&completeStep(1)} style={{ marginTop:8, background:selections.step1.length>0?`linear-gradient(135deg,${path.accentColor},${G.mid})`:"#E0D8D0", color:selections.step1.length>0?"#fff":"#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:selections.step1.length>0?"pointer":"not-allowed" }}>Confirm →</button></>):(<>{path.step1.options.map(opt=><OptionRow key={opt.name||opt} option={typeof opt==="string"?{name:opt}:opt} selected={selections.step1.includes(opt.name||opt)||(opt.name||opt)===path.step1.confirmed} onSelect={handleSel1} accentColor={path.accentColor}/>)}<button onClick={()=>{if(!selections.step1.length&&path.step1.confirmed)setSelections(prev=>({...prev,step1:[path.step1.confirmed]}));completeStep(1);}} style={{ marginTop:8, background:`linear-gradient(135deg,${path.accentColor},${G.mid})`, color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Confirm →</button></>)}</div>)}
  {currentStep===2&&(<div><div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step2.title}</div><div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step2.desc}</div>{path.step2.options.map(opt=><OptionRow key={opt.name} option={opt} selected={selections.step2===opt.name} onSelect={handleSel2} accentColor={path.accentColor}/>)}<button onClick={()=>selections.step2&&completeStep(2)} style={{ marginTop:8, background:selections.step2?`linear-gradient(135deg,${path.accentColor},${G.mid})`:"#E0D8D0", color:selections.step2?"#fff":"#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:selections.step2?"pointer":"not-allowed" }}>Confirm →</button></div>)}
  {currentStep===3&&(<div><div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step3.title}</div><div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step3.desc}</div>{path.step3.options.map(opt=><OptionRow key={opt.name} option={opt} selected={selections.step3.includes(opt.name)} onSelect={handleSel3} accentColor={path.accentColor}/>)}<button onClick={()=>selections.step3.length>0&&completeStep(3)} style={{ marginTop:8, background:selections.step3.length>0?`linear-gradient(135deg,${path.accentColor},${G.mid})`:"#E0D8D0", color:selections.step3.length>0?"#fff":"#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:selections.step3.length>0?"pointer":"not-allowed" }}>See {pet.name}'s Plan →</button></div>)}
  </ModalShell>);
}

// ─── PATH CARD — Care/Learn 3-column style ───────────────────
function PathCard({ path, pet, onOpen }) {
  const petName = pet?.name || 'your dog';
  return (
    <div onClick={onOpen}
      data-testid={`paperwork-path-${path.id}`}
      style={{ background:'#fff', borderRadius:16, border:`2px solid rgba(13,148,136,0.14)`,
        padding:'20px', cursor:'pointer', transition:'all 0.18s',
        ...(path.miraPick?{boxShadow:`0 4px 20px ${path.accentColor}25`}:{}) }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 24px ${path.accentColor}20`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=path.miraPick?`0 4px 20px ${path.accentColor}25`:'none';}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
        <div style={{width:50,height:50,borderRadius:14,background:path.iconBg||G.pale,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>{path.icon}</div>
        {path.badge&&<span style={{fontSize:9,fontWeight:700,padding:'3px 9px',borderRadius:20,background:path.badgeBg||path.accentColor,color:'#fff',flexShrink:0}}>{path.badge}</span>}
      </div>
      <div style={{fontSize:15,fontWeight:800,color:G.darkText,marginBottom:6,fontFamily:'Georgia,serif'}}>{path.title}</div>
      <div style={{fontSize:13,color:'#888',lineHeight:1.6,marginBottom:14}}>{path.desc}</div>
      <div style={{display:'flex',gap:5,marginBottom:12}}>
        {(path.stepLabels||[]).map((label,i)=>(
          <div key={i} style={{flex:1}}>
            <div style={{height:3,borderRadius:3,marginBottom:3,background:i===0?path.accentColor:'rgba(13,148,136,0.15)'}}/>
            <div style={{fontSize:9,color:'#aaa',textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:13,color:path.accentColor,fontWeight:700}}>Start for {petName} →</div>
    </div>
  );
}

// ─── EXPORT ──────────────────────────────────────────────────
export default function GuidedPaperworkPaths({ pet }) {
  const [activePath,setActivePath]=useState(null);
  const allPaths=buildPaths(pet);
  const activePathData=allPaths.find(p=>p.id===activePath);
  const petName=pet?.name||'your dog';
  return (
    <section style={{marginBottom:36}}>
      <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:6}}>
        <h3 style={{fontSize:'clamp(1.125rem,2.5vw,1.375rem)',fontWeight:800,color:G.darkText,margin:0,fontFamily:'Georgia,serif'}}>Guided Document Paths</h3>
        <span style={{fontSize:11,background:`linear-gradient(135deg,${G.teal||'#0D9488'},${G.mid||'#334155'})`,color:'#fff',borderRadius:20,padding:'2px 10px',fontWeight:700}}>{allPaths.length} paths</span>
      </div>
      <p style={{fontSize:13,color:'#888',marginBottom:20,lineHeight:1.5}}>Step-by-step document protection arranged by Concierge® — each personalised for {petName}.</p>
      <div style={{display:'grid',gap:14}} className="gpp-grid">
        <style>{`.gpp-grid{grid-template-columns:1fr}@media(min-width:480px){.gpp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(min-width:960px){.gpp-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}`}</style>
        {allPaths.map(path=><PathCard key={path.id} path={path} pet={pet} onOpen={()=>setActivePath(path.id)}/>)}
      </div>
      {activePath&&activePathData&&<PathFlowModal path={activePathData} pet={pet} onClose={()=>setActivePath(null)}/>}
    </section>
  );
}
