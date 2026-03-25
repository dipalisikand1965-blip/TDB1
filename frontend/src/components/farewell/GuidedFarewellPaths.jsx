/**
 * GuidedFarewellPaths.jsx — /farewell pillar
 * The Doggy Company
 *
 * 5 PATHS — written with the gentleness this pillar deserves.
 * This page exists because of Mystique.
 *
 * 1. End-of-Life Planning Path   — quality of life, comfort care decisions
 * 2. Cremation & Burial Path     — dignified arrangements
 * 3. Memorial & Legacy Path      — how to honour a life well lived
 * 4. Grief Support Path          — for the humans who loved them
 * 5. Celebrate Their Life Path   — a tribute, not just a goodbye
 *
 * HOW TO USE:
 *   import GuidedFarewellPaths from "../components/farewell/GuidedFarewellPaths";
 *   <GuidedFarewellPaths pet={petData} />
 *
 * WIRING: POST /api/concierge/farewell-path
 * TONE:   Gentle. Unhurried. Never clinical.
 */
import { useState } from "react";
import { guidedPathComplete } from "../../utils/MiraCardActions";

const G = { deep:"#1A1A2E", mid:"#2D2D4E", indigo:"#6366F1", light:"#A5B4FC", pale:"#EEF2FF", cream:"#F5F7FF", darkText:"#1A1A2E", mutedText:"#4338CA" };
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

function buildPaths(pet) {
  const name  = pet?.name  || "your beloved dog";
  const breed = pet?.breed || pet?.doggy_soul_answers?.breed || "your breed";

  return [
    {
      id:"eol_planning",
      icon:"🕊️", iconBg:"#EEF2FF", accentColor:G.indigo, accentBg:"#EEF2FF", accentBorder:"#A5B4FC",
      badgeBg:G.indigo, badge:"Gentle guidance",
      photoBg:"linear-gradient(135deg,#EEF2FF,#C7D2FE)",
      title:"End-of-Life Planning Path",
      desc:`A gentle path through the decisions that come when ${name} is approaching the end of their life. At your own pace.`,
      stepLabels:["Quality of life — an honest check","Comfort care priorities","The final goodbye — options","Your end-of-life plan"],
      miraNote:`There is no right or wrong way to feel right now. This path exists to make sure ${name} is comfortable, and that you feel supported in every decision. Take it at your own pace.`,
      step1:{
        title:`Quality of life — an honest check for ${name}`,
        desc:"These questions are hard. But answering them honestly is one of the most loving things you can do.",
        type:"multi_select",
        options:[
          { icon:"🍽️", name:"Still eating and drinking", desc:"Appetite is one of the clearest indicators of comfort" },
          { icon:"😊", name:"Still having good moments", desc:"Joy, recognition, connection — even brief ones matter" },
          { icon:"🚶", name:"Still moving without pain",  desc:"Mobility and pain-free movement" },
          { icon:"😴", name:"Sleeping comfortably",        desc:"Rest without restlessness or distress" },
          { icon:"❤️", name:"Still knows us and connects", desc:"Recognition and connection with family" },
        ],
      },
      step2:{
        title:`Comfort care priorities for ${name}`,
        desc:"The focus now is on quality, not quantity. What matters most for comfort.",
        type:"multi_select",
        options:[
          { icon:"🛏️", name:"Comfortable resting place",             desc:"Orthopaedic mat, warmth, easy to get up from",       mira:true },
          { icon:"💊", name:"Pain management with vet",              desc:"Palliative care — talk to your vet about options" },
          { icon:"🌡️", name:"Temperature and environment",           desc:"Neither too hot nor too cold — they can't regulate as well" },
          { icon:"🤲", name:"Gentle company and touch",              desc:"Presence is the most important comfort" },
          { icon:"🍗", name:"Favourite foods when possible",         desc:"Appetite may be small — make each meal special" },
          { icon:"🏥", name:"Home visits from vet",                  desc:"Reducing vet clinic visits reduces stress" },
        ],
      },
      step3:{
        title:"The final goodbye — understanding the options",
        desc:"Mira presents these gently. There is no wrong choice when made from love.",
        type:"select_one",
        miraPick:"In-home euthanasia — peaceful and private",
        options:[
          { icon:"🏠", name:"In-home euthanasia — peaceful and private", desc:"At home, with family, in familiar surroundings",      mira:true },
          { icon:"🏥", name:"At a veterinary clinic",                    desc:"Some families prefer the clinical setting and support" },
          { icon:"🕰️", name:"Natural end — with palliative support",    desc:"When the time is very close — comfort care through" },
          { icon:"❓", name:"I need more time — just information",       desc:"No decision needed now. Mira is here when you are ready." },
        ],
      },
      step4:{
        title:`${name}'s End-of-Life Plan`,
        summaryFields:["Quality of life","Comfort care","Final goodbye approach","Next step"],
        cta:"🕊️ Hand to Concierge® — gently",
        conciergeNote:"Your Concierge® will arrange a home visit from a compassionate vet and support you through every next step, at your pace.",
      },
    },
    {
      id:"cremation_burial",
      icon:"🌸", iconBg:"#FCE4EC", accentColor:"#C2185B", accentBg:"#FCE4EC", accentBorder:"#F48FB1",
      badgeBg:"#C2185B", badge:"With dignity",
      photoBg:"linear-gradient(135deg,#FCE4EC,#F8BBD9)",
      title:"Cremation & Burial Path",
      desc:`Arrange a dignified farewell for ${name} — with the care and respect they deserve.`,
      stepLabels:["What feels right for your family","Type of service","Keeping them close","Your cremation and burial plan"],
      miraNote:`There is no correct choice here — only what feels right for ${name} and your family. Mira will arrange whichever option you choose with complete dignity and care.`,
      step1:{
        title:"What feels right for your family",
        desc:"Take a moment with this. There is no rush.",
        type:"select_one",
        miraPick:"Individual cremation — ashes returned to family",
        options:[
          { icon:"🌿", name:"Individual cremation — ashes returned",     desc:"Private service, ashes returned in a chosen vessel",  mira:true },
          { icon:"🌺", name:"Burial in a pet cemetery",                  desc:"A dedicated place to visit — permanent and marked" },
          { icon:"🌳", name:"Home burial with memorial",                 desc:"On your property — with a tree or stone planted" },
          { icon:"🌍", name:"Biodegradable — return to earth",           desc:"Seed-infused urn — a tree grows in their memory" },
        ],
      },
      step2:{
        title:"Type of cremation service",
        desc:"For families choosing cremation — the options matter.",
        type:"select_one",
        miraPick:"Individual cremation with private ceremony",
        options:[
          { icon:"🙏", name:"Individual cremation with private ceremony", desc:"Only your pet — private, with a short ceremony",     mira:true },
          { icon:"📦", name:"Individual cremation — no ceremony",          desc:"Private cremation, ashes returned within 48 hours" },
          { icon:"👥", name:"Group cremation",                             desc:"With other pets — lower cost, no ashes returned" },
          { icon:"🌿", name:"Green cremation (aquamation)",               desc:"Water-based process — more gentle on the environment" },
        ],
      },
      step3:{
        title:`Keeping ${name} close`,
        desc:"How you'd like to hold their memory — physically.",
        type:"multi_select",
        options:[
          { icon:"🏺", name:"Elegant urn for the home",              desc:"Keep the ashes in a beautiful, dignified vessel",        mira:true },
          { icon:"🪴", name:"Memorial tree or plant",                desc:"Life growing in their memory — in the garden" },
          { icon:"💎", name:"Memorial glass art",                    desc:"A small amount of ashes set in beautiful glass" },
          { icon:"📿", name:"Memorial pendant",                      desc:"A small amount of ashes in jewellery you can wear" },
          { icon:"🖼️", name:"Paw print memorial frame",             desc:"Their paw print, framed — a permanent impression" },
        ],
      },
      step4:{
        title:`${name}'s Farewell Arrangements`,
        summaryFields:["What feels right","Type of service","Keeping them close","Next step"],
        cta:"🌸 Hand to Concierge®",
        conciergeNote:"Your Concierge® will arrange everything with complete dignity. You will not need to make phone calls or manage logistics. We handle all of it.",
      },
    },
    {
      id:"memorial_legacy",
      icon:"💛", iconBg:"#FFF8DC", accentColor:"#C9973A", accentBg:"#FFF8DC", accentBorder:"#FFD700",
      badgeBg:"#C9973A", badge:"Honour them",
      photoBg:"linear-gradient(135deg,#FFF8DC,#FFEAA7)",
      title:"Memorial & Legacy Path",
      desc:`${name}'s life deserves to be honoured and remembered — in ways that feel true to who they were.`,
      stepLabels:["How you want to remember them","A permanent memorial","Sharing their story","Your memorial and legacy plan"],
      miraNote:`${name}'s life was a gift — to you, to everyone who knew them. A memorial isn't just about grief. It's about love. It's about making sure their presence continues to matter.`,
      step1:{
        title:`How you want to remember ${name}`,
        desc:"There are as many ways to honour a dog as there are dogs. What feels right for this one.",
        type:"multi_select",
        options:[
          { icon:"📸", name:"Photo book — their whole life",            desc:"Premium hardcover — every chapter of their story",   mira:true },
          { icon:"🎨", name:"Custom watercolour portrait",              desc:"An artist's portrait from your favourite photo" },
          { icon:"📖", name:"Memory book — stories and moments",        desc:"A place to write down everything you remember" },
          { icon:"🌳", name:"Plant a tree or garden",                   desc:"Life growing in their memory — somewhere you visit" },
          { icon:"💻", name:"Digital memorial page",                    desc:"Share their story with everyone who loved them" },
        ],
      },
      step2:{
        title:"A permanent memorial",
        desc:"Something that lasts — that you can touch and return to.",
        type:"select_one",
        miraPick:"Paw print and memorial ornament",
        options:[
          { icon:"🐾", name:"Paw print and memorial ornament",          desc:"Their actual print — preserved forever",             mira:true },
          { icon:"🪨", name:"Engraved garden stone",                    desc:"Name, dates, a few words — in the garden" },
          { icon:"🖼️", name:"Framed portrait and tribute",             desc:"Portrait with a written tribute — in your home" },
          { icon:"💎", name:"Bespoke memorial commission",              desc:"A unique piece made specifically for this dog" },
        ],
      },
      step3:{
        title:`Sharing ${name}'s story`,
        desc:"Grief can be lonely. Sharing the story of a well-loved dog invites others to grieve with you.",
        type:"multi_select",
        options:[
          { icon:"📱", name:"Social media tribute",                    desc:"A post or a series — their life in photos and words" },
          { icon:"🌐", name:"Online memorial page",                    desc:"A permanent page — for family and friends to visit" },
          { icon:"🐾", name:"Donate in their name",                   desc:"To a rescue or shelter — their love continues" },
          { icon:"📨", name:"Private tribute to those who knew them",  desc:"An email or card to family and friends who knew them" },
        ],
      },
      step4:{
        title:`${name}'s Memorial Plan`,
        summaryFields:["How to remember them","Permanent memorial","Sharing their story","Next step"],
        cta:"💛 Hand to Concierge®",
        conciergeNote:"Your Concierge® will commission the memorial pieces, arrange the portrait artist, and help you prepare the tribute.",
      },
    },
    {
      id:"grief_support",
      icon:"💙", iconBg:"#E3F2FD", accentColor:"#1565C0", accentBg:"#E3F2FD", accentBorder:"#90CAF9",
      badgeBg:"#1565C0", badge:"You are not alone",
      photoBg:"linear-gradient(135deg,#E3F2FD,#BBDEFB)",
      title:"Grief Support Path",
      desc:"Grief for a pet is real, valid, and often misunderstood by those who haven't experienced it. You are not alone in this.",
      stepLabels:["Where you are right now","What helps — for you","Support and community","Your grief support plan"],
      miraNote:"The grief you feel is proportional to the love you gave. That love was real. And this grief is real. I'm here to help you find the support that feels right — not to rush you through it.",
      step1:{
        title:"Where you are right now",
        desc:"There is no right place to be. Just honest.",
        type:"select_one",
        miraPick:"In the middle of it — need support now",
        options:[
          { icon:"🌊", name:"In the middle of it — need support now", desc:"Intense grief — the acute phase. Support matters most now.", mira:true },
          { icon:"🌤️", name:"Finding my way through — slowly",         desc:"Some days are better. Need help on the harder ones." },
          { icon:"🌿", name:"Supporting someone else through this",    desc:"A family member or friend — help them, not me" },
          { icon:"📚", name:"Preparing — they are still here",         desc:"Anticipatory grief — knowing what's coming" },
        ],
      },
      step2:{
        title:"What helps — for you",
        desc:"Grief is not one size. What helps one person may not help another. Choose honestly.",
        type:"multi_select",
        options:[
          { icon:"🗣️", name:"Talking to someone who understands", desc:"A counsellor with pet loss experience",             mira:true },
          { icon:"📖", name:"Reading and understanding",           desc:"Books, letters — understanding makes grief less lonely" },
          { icon:"🤝", name:"Community and connection",            desc:"Others who have been through it — not alone" },
          { icon:"✍️", name:"Writing and journalling",             desc:"A grief journal — for what's too heavy to hold in" },
          { icon:"🌿", name:"Nature and quiet",                    desc:"Walks, gardens, open air — space to breathe" },
          { icon:"🕰️", name:"Time and patience",                   desc:"No pressure — grief moves at its own pace" },
        ],
      },
      step3:{
        title:"Support and community",
        desc:"Mira will connect you with the right support — at the right level.",
        type:"select_one",
        miraPick:"Pet loss counsellor — one session to start",
        options:[
          { icon:"🧠", name:"Pet loss counsellor — one session",   desc:"Professional, experienced — one session to start",   mira:true },
          { icon:"👥", name:"Pet loss support group",               desc:"Community of people who understand exactly" },
          { icon:"📞", name:"Pet bereavement helpline",             desc:"Available when grief arrives — including at night" },
          { icon:"📚", name:"Books and letters on pet loss",        desc:"C.S. Lewis, Merrit Malloy — others have written this grief" },
        ],
      },
      step4:{
        title:"Your Grief Support Plan",
        summaryFields:["Where you are","What helps","Support chosen","Next step"],
        cta:"💙 Hand to Concierge®",
        conciergeNote:"Your Concierge® will connect you with the right counsellor or support group — gently, and at your pace.",
      },
    },
    {
      id:"celebrate_life",
      icon:"✨", iconBg:"#FFF9C4", accentColor:"#F9A825", accentBg:"#FFF9C4", accentBorder:"#FDD835",
      badgeBg:"#F9A825", badge:"Their story",
      photoBg:"linear-gradient(135deg,#FFF9C4,#FFF176)",
      title:"Celebrate Their Life Path",
      desc:`A tribute to ${name} — their character, their quirks, the ways they changed everything.`,
      stepLabels:["What made them them","Gathering the memories","Sharing the celebration","Your celebration plan"],
      miraNote:`${name}'s life deserves a celebration — not just a goodbye. Tell me what made them ${name}, and I'll help you honour that.`,
      step1:{
        title:`What made ${name} them`,
        desc:"This is the part only you can fill in. Take your time.",
        type:"multi_select",
        options:[
          { icon:"😄", name:"Their personality",                   desc:"Stubborn, gentle, goofy, wise — all of it" },
          { icon:"🎭", name:"The things they did that were just them", desc:"The quirks only you noticed" },
          { icon:"💪", name:"What they taught you",                desc:"About patience, unconditional love, living fully" },
          { icon:"🌟", name:"Their best moments",                  desc:"The days you'll always remember" },
          { icon:"❤️", name:"How they changed your life",          desc:"Before and after — they mattered" },
        ],
      },
      step2:{
        title:"Gathering the memories",
        desc:"The raw material of the tribute — photos, stories, the things you want to keep.",
        type:"multi_select",
        options:[
          { icon:"📸", name:"Best photos — curated",               desc:"The ones that captured who they really were",           mira:true },
          { icon:"📝", name:"Stories — written down",              desc:"Before they fade — every one matters" },
          { icon:"📹", name:"Videos",                              desc:"The sound of them, the way they moved" },
          { icon:"📋", name:"Their vet records — a life in data",  desc:"First visit, last visit — a whole life between" },
          { icon:"🏷️", name:"Their collar and tag",               desc:"The physical objects — what to keep, what to preserve" },
        ],
      },
      step3:{
        title:"Sharing the celebration",
        desc:"Grief shared is grief held. Let others celebrate them with you.",
        type:"select_one",
        miraPick:"Photo book — their complete life story",
        options:[
          { icon:"📚", name:"Photo book — their complete life story", desc:"Premium hardcover — every chapter",                  mira:true },
          { icon:"🎉", name:"Celebration gathering",                 desc:"Friends and family — everyone who loved them" },
          { icon:"📱", name:"Digital tribute — shared online",        desc:"A permanent page everyone can contribute to" },
          { icon:"🌳", name:"Living memorial — a tree planted",       desc:"A physical place to go and remember" },
        ],
      },
      step4:{
        title:`Your Celebration of ${name}'s Life`,
        summaryFields:["Who they were","Memories to gather","How to share","Next step"],
        cta:"✨ Hand to Concierge®",
        conciergeNote:"Your Concierge® will commission the photo book, help prepare the tribute, and arrange any gathering — exactly as you want it.",
      },
    },
  ]
}

// ─── SHARED COMPONENTS ───────────────────────────────────────
function StepIndicator({ steps, currentStep, completedSteps, accentColor }) {
  return (<div style={{ display:"flex", flexDirection:"column", gap:0, marginBottom:24 }}>{steps.map((label, i) => { const stepNum=i+1, isComplete=completedSteps.includes(stepNum), isCurrent=currentStep===stepNum, isPending=!isComplete&&!isCurrent; return (<div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14 }}><div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}><div style={{ width:32, height:32, borderRadius:"50%", background:isComplete||isCurrent?accentColor:"#E0D8D0", color:isComplete||isCurrent?"#fff":"#999", display:"flex", alignItems:"center", justifyContent:"center", fontSize:isComplete?14:13, fontWeight:700, transition:"all 0.2s" }}>{isComplete?"✓":stepNum}</div>{i<steps.length-1&&<div style={{ width:2, height:28, background:isComplete?accentColor:"#E0D8D0", transition:"background 0.3s" }}/>}</div><div style={{ paddingTop:6, paddingBottom:i<steps.length-1?28:16, fontSize:14, fontWeight:isCurrent?700:400, color:isPending?"#BBB":"#1A0A00" }}>{label}{isComplete&&<span style={{ marginLeft:10, fontSize:11, fontWeight:600, color:accentColor, background:`${accentColor}18`, borderRadius:20, padding:"1px 8px" }}>✓ Done</span>}</div></div>); })}</div>);
}

function OptionRow({ option, selected, onSelect, accentColor }) {
  return (<div onClick={() => onSelect(option.name||option)} style={{ background:selected?`${accentColor}10`:"#fff", border:`1.5px solid ${selected?accentColor:"#F0E8E0"}`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"all 0.12s", marginBottom:6 }}>{option.icon&&<span style={{ fontSize:24, flexShrink:0 }}>{option.icon}</span>}<div style={{ flex:1 }}><div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}><span style={{ fontSize:14, fontWeight:700, color:"#1A0A00" }}>{option.name||option}</span>{option.mira&&<span style={{ background:`${accentColor}18`, color:accentColor, fontSize:10, fontWeight:700, borderRadius:20, padding:"1px 7px" }}>★ Mira's pick</span>}</div>{option.desc&&<div style={{ fontSize:12, color:"#888" }}>{option.desc}</div>}</div>{selected&&<div style={{ width:22, height:22, borderRadius:"50%", background:accentColor, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:12, fontWeight:700, flexShrink:0 }}>✓</div>}</div>);
}

function ModalShell({ onClose, children, noPadding }) {
  return (<div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.50)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}><div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:20, width:"min(720px,100%)", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.20)", padding:noPadding?0:"28px 28px 24px", border:"2px solid #F0E8E0" }}>{children}</div></div>);
}

function PathFlowModal({ path, pet, onClose }) {
  const [currentStep,setCurrentStep]=useState(1); const [completedSteps,setCompletedSteps]=useState([]); const [selections,setSelections]=useState({step1:[],step2:null,step3:[],step4:null}); const [submitted,setSubmitted]=useState(false);
  const totalSteps=4;
  const completeStep=(step)=>{ if(!completedSteps.includes(step))setCompletedSteps(prev=>[...prev,step]); if(step<totalSteps)setCurrentStep(step+1); };
  const handleSel1=(val)=>{ if(path.step1.type==="confirm_condition"){setSelections(prev=>({...prev,step1:[val]}));}else{setSelections(prev=>{const cur=prev.step1;return{...prev,step1:cur.includes(val)?cur.filter(v=>v!==val):[...cur,val]};});}};
  const handleSel2=(val)=>setSelections(prev=>({...prev,step2:val}));
  const handleSel3=(val)=>setSelections(prev=>{const cur=prev.step3;if(path.step3.type==="select_one")return{...prev,step3:[val]};return{...prev,step3:cur.includes(val)?cur.filter(v=>v!==val):[...cur,val]};});
  const handleSubmit = () => {
    guidedPathComplete({ pathTitle: path?.title || "Farewell Path", pillar: "farewell", pet, channel: "farewell_guided_paths_complete", onSuccess: () => setSubmitted(true) });
    setSubmitted(true);
  }; // POST /api/concierge/farewell-path

  if(submitted)return(<ModalShell onClose={onClose} noPadding><div style={{ background:`linear-gradient(135deg,${G.deep},${G.mid})`, borderRadius:20, padding:"48px 40px", textAlign:"center", minHeight:320, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}><div style={{ width:64, height:64, borderRadius:"50%", background:`linear-gradient(135deg,${path.accentColor},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:20 }}>♥</div><div style={{ fontSize:22, fontWeight:800, color:"#fff", fontFamily:"Georgia,serif", marginBottom:10 }}>{path.title.replace(" Path","")} sent to your Concierge®.</div><div style={{ fontSize:14, color:"rgba(255,255,255,0.55)", marginBottom:28, lineHeight:1.6 }}>Everything is in good hands.<br/>Your Concierge® will reach out within 48 hours. ♥</div><button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.20)", color:"#fff", borderRadius:20, padding:"10px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Done</button></div></ModalShell>);

  if(currentStep===4&&completedSteps.includes(3)){
    const summaryData={[path.step4.summaryFields[0]]:selections.step1.join(", ")||"Not specified",[path.step4.summaryFields[1]]:selections.step2||"Not selected",[path.step4.summaryFields[2]]:selections.step3.join(", ")||"Not selected",[path.step4.summaryFields[3]]:"Concierge® will contact within 48h"};
    return(<ModalShell onClose={onClose}><div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}><div style={{ width:44, height:44, borderRadius:10, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{path.icon}</div><div><div style={{ fontSize:17, fontWeight:800, color:"#1A0A00", fontFamily:"Georgia,serif" }}>{path.title.replace(" Path",` for ${pet.name}`)}</div><div style={{ fontSize:12, color:"#888", marginTop:2 }}>{path.step4.summaryFields.join(" · ")} · All confirmed</div></div><button onClick={onClose} style={{ marginLeft:"auto", background:"#F5F5F5", border:"none", borderRadius:"50%", width:32, height:32, fontSize:16, cursor:"pointer", color:"#555" }}>✕</button></div><div style={{ background:"#fff", border:"1px solid #F0E8E0", borderRadius:14, marginBottom:20, overflow:"hidden" }}>{Object.entries(summaryData).map(([k,v],i)=>(<div key={k} style={{ display:"flex", alignItems:"flex-start", padding:"14px 18px", borderBottom:i<Object.entries(summaryData).length-1?"1px solid #F5F0EA":"none" }}><div style={{ fontSize:13, fontWeight:700, color:path.accentColor, width:160, flexShrink:0 }}>{k}</div><div style={{ fontSize:13, color:"#1A0A00", flex:1, lineHeight:1.5 }}>{v}</div></div>))}</div><button onClick={handleSubmit} style={{ width:"100%", background:`linear-gradient(135deg,${path.accentColor},${G.mid})`, color:"#fff", border:"none", borderRadius:14, padding:"16px", fontSize:16, fontWeight:800, cursor:"pointer", marginBottom:10 }}>{path.step4.cta}</button><div style={{ fontSize:12, color:"#888", textAlign:"center" }}>{path.step4.conciergeNote}</div></ModalShell>);
  }

  return(<ModalShell onClose={onClose}><div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}><div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ width:44, height:44, borderRadius:10, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{path.icon}</div><div><div style={{ fontSize:17, fontWeight:800, color:"#1A0A00", fontFamily:"Georgia,serif" }}>{path.title.replace(" Path",` for ${pet.name}`)}</div><div style={{ fontSize:12, color:"#888", marginTop:2 }}>{totalSteps} steps. One complete plan.</div></div></div><button onClick={onClose} style={{ background:"#F5F5F5", border:"none", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:600, color:"#555", cursor:"pointer" }}>Close</button></div>
  <div style={{ background:`${path.accentColor}12`, border:`1px solid ${path.accentColor}30`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:10, marginBottom:22 }}><div style={{ width:28, height:28, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0 }}>✦</div><div><div style={{ fontSize:13, color:"#1A0A00", fontStyle:"italic", lineHeight:1.55 }}>{path.miraNote}</div><div style={{ fontSize:11, color:path.accentColor, fontWeight:600, marginTop:3 }}>♥ Mira knows {pet.name}</div></div></div>
  <StepIndicator steps={path.stepLabels} currentStep={currentStep} completedSteps={completedSteps} accentColor={path.accentColor}/>
  {currentStep===1&&(<div><div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step1.title}</div><div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step1.desc}</div>{path.step1.type==="multi_select"?(<>{path.step1.options.map(opt=><OptionRow key={opt.name||opt} option={opt} selected={selections.step1.includes(opt.name||opt)} onSelect={handleSel1} accentColor={path.accentColor}/>)}<button onClick={()=>selections.step1.length>0&&completeStep(1)} style={{ marginTop:8, background:selections.step1.length>0?`linear-gradient(135deg,${path.accentColor},${G.mid})`:"#E0D8D0", color:selections.step1.length>0?"#fff":"#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:selections.step1.length>0?"pointer":"not-allowed" }}>Confirm →</button></>):(<>{path.step1.options.map(opt=><OptionRow key={opt.name||opt} option={typeof opt==="string"?{name:opt}:opt} selected={selections.step1.includes(opt.name||opt)||(opt.name||opt)===path.step1.confirmed} onSelect={handleSel1} accentColor={path.accentColor}/>)}<button onClick={()=>{if(!selections.step1.length&&path.step1.confirmed)setSelections(prev=>({...prev,step1:[path.step1.confirmed]}));completeStep(1);}} style={{ marginTop:8, background:`linear-gradient(135deg,${path.accentColor},${G.mid})`, color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Confirm →</button></>)}</div>)}
  {currentStep===2&&(<div><div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step2.title}</div><div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step2.desc}</div>{path.step2.options.map(opt=><OptionRow key={opt.name} option={opt} selected={selections.step2===opt.name} onSelect={handleSel2} accentColor={path.accentColor}/>)}<button onClick={()=>selections.step2&&completeStep(2)} style={{ marginTop:8, background:selections.step2?`linear-gradient(135deg,${path.accentColor},${G.mid})`:"#E0D8D0", color:selections.step2?"#fff":"#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:selections.step2?"pointer":"not-allowed" }}>Confirm →</button></div>)}
  {currentStep===3&&(<div><div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step3.title}</div><div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step3.desc}</div>{path.step3.options.map(opt=><OptionRow key={opt.name} option={opt} selected={selections.step3.includes(opt.name)} onSelect={handleSel3} accentColor={path.accentColor}/>)}<button onClick={()=>selections.step3.length>0&&completeStep(3)} style={{ marginTop:8, background:selections.step3.length>0?`linear-gradient(135deg,${path.accentColor},${G.mid})`:"#E0D8D0", color:selections.step3.length>0?"#fff":"#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:selections.step3.length>0?"pointer":"not-allowed" }}>See {pet.name}'s Plan →</button></div>)}
  </ModalShell>);
}

// ─── EXPORT ──────────────────────────────────────────────────
function PathCard({ path, pet, onOpen }) {
  const petName = pet?.name || 'your dog';
  return (
    <div onClick={onOpen}
      style={{ background:'#fff', borderRadius:16, border:`2px solid rgba(99,102,241,0.14)`, padding:'20px', cursor:'pointer', transition:'all 0.18s', ...(path.miraPick?{boxShadow:`0 4px 20px ${path.accentColor}25`}:{}) }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 24px ${path.accentColor}20`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=path.miraPick?`0 4px 20px ${path.accentColor}25`:'none';}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
        <div style={{width:50,height:50,borderRadius:14,background:path.iconBg||'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>{path.icon}</div>
        {path.badge&&<span style={{fontSize:9,fontWeight:700,padding:'3px 9px',borderRadius:20,background:path.badgeBg||path.accentColor,color:'#fff',flexShrink:0}}>{path.badge}</span>}
      </div>
      <div style={{fontSize:15,fontWeight:800,color:G.darkText,marginBottom:6,fontFamily:'Georgia,serif'}}>{path.title}</div>
      <div style={{fontSize:13,color:'#888',lineHeight:1.6,marginBottom:14}}>{path.desc}</div>
      <div style={{display:'flex',gap:5,marginBottom:12}}>
        {(path.stepLabels||[]).map((label,i)=>(
          <div key={i} style={{flex:1}}>
            <div style={{height:3,borderRadius:3,marginBottom:3,background:i===0?path.accentColor:'rgba(99,102,241,0.15)'}}/>
            <div style={{fontSize:9,color:'#aaa',textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:13,color:path.accentColor,fontWeight:700}}>Start for {petName} →</div>
    </div>
  );
}

export default function GuidedFarewellPaths({ pet }) {
  const [activePath,setActivePath]=useState(null);
  const allPaths=buildPaths(pet);
  const activePathData=allPaths.find(p=>p.id===activePath);
  const petName=pet?.name||'your dog';
  return (
    <section style={{marginBottom:36}}>
      <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:6}}>
        <h3 style={{fontSize:'clamp(1.125rem,2.5vw,1.375rem)',fontWeight:800,color:G.darkText,margin:0,fontFamily:'Georgia,serif'}}>Guided Farewell Paths</h3>
        <span style={{fontSize:11,background:`linear-gradient(135deg,${G.indigo||'#6366F1'},${G.mid||'#4B4B6E'})`,color:'#fff',borderRadius:20,padding:'2px 10px',fontWeight:700}}>{allPaths.length} paths</span>
      </div>
      <p style={{fontSize:13,color:'#888',marginBottom:20,lineHeight:1.5}}>Gentle, step-by-step guidance arranged by Concierge® — when you're ready, for {petName}.</p>
      <div style={{display:'grid',gap:14}} className="gfp-grid">
        <style>{`.gfp-grid{grid-template-columns:1fr}@media(min-width:480px){.gfp-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(min-width:960px){.gfp-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}`}</style>
        {allPaths.map(path=><PathCard key={path.id} path={path} pet={pet} onOpen={()=>setActivePath(path.id)}/>)}
      </div>
      {activePath&&activePathData&&<PathFlowModal path={activePathData} pet={pet} onClose={()=>setActivePath(null)}/>}
    </section>
  );
}
