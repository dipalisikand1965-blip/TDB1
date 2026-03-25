/**
 * GuidedAdoptPaths.jsx — /adopt pillar
 * The Doggy Company
 *
 * 5 PATHS:
 *   1. Breed Match Path         — find the right breed for your lifestyle
 *   2. Adoption Readiness Path  — home, lifestyle, finances, family
 *   3. Home Preparation Path    — dog-proof, setup, supplies
 *   4. First 30 Days Path       — settling in, vet, training, bonding
 *   5. Rescue Dog Path          — trauma-aware care for rescue dogs
 *
 * HOW TO USE:
 *   import GuidedAdoptPaths from "../components/adopt/GuidedAdoptPaths";
 *   <GuidedAdoptPaths pet={petData} />
 *
 * WIRING: POST /api/concierge/adopt-path
 */
import { useState } from "react";
import { guidedPathComplete } from "../../utils/MiraCardActions";

const G = { deep:"#4A0E2E", mid:"#7B1D4A", mauve:"#D4537E", light:"#F4C0D1", pale:"#FFF0F5", cream:"#FFF5F8", darkText:"#4A0E2E", mutedText:"#7B1D4A" };
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

function buildPaths(pet) {
  const name    = pet?.name  || "your dog";
  const breed   = pet?.breed || pet?.doggy_soul_answers?.breed || "your breed";
  const isRescue = !!(pet?.doggy_soul_answers?.is_rescue);
  const stage   = pet?.doggy_soul_answers?.adoption_stage || "Thinking";
  const hasChildren = !!(pet?.doggy_soul_answers?.has_children);
  const multiPet    = !!(pet?.doggy_soul_answers?.other_pets);

  return [
    {
      id:"breed_match",
      icon:"🔍", iconBg:"#FFF0F5", accentColor:G.mauve, accentBg:"#FFF0F5", accentBorder:"#F4C0D1",
      badgeBg:G.mauve, badge:"Start here",
      photoBg:"linear-gradient(135deg,#FFF0F5,#FCE4EC)",
      title:"Breed Match Path",
      desc:"Find the right breed — energy, size, family compatibility — matched to your actual life, not your ideal life.",
      stepLabels:["Your lifestyle honestly","Family and home situation","Breed preferences","Your breed match plan"],
      miraNote:`The most common reason adoptions fail is mismatch — the wrong breed for the lifestyle. I'll match ${name?`${name}'s family`:"your family"} to the right dog, not the prettiest one.`,
      step1:{
        title:"Your honest lifestyle",
        desc:"Mira matches to your real day — not the life you want to have.",
        type:"select_one",
        miraPick:"Moderately active — daily walks, some outdoor time",
        options:[
          { icon:"🏃", name:"Very active — running, hiking, lots of outdoor time", desc:"High-energy breeds will thrive" },
          { icon:"🚶", name:"Moderately active — daily walks, some outdoor time",  desc:"Most breeds are a good fit",  mira:true },
          { icon:"🏠", name:"Mostly indoors — short walks, calm home",             desc:"Lower-energy breeds are better matches" },
          { icon:"👴", name:"Limited mobility — gentle companion needed",           desc:"Senior dogs and calm breeds work best" },
        ],
      },
      step2:{
        title:"Family and home situation",
        desc:"Mira uses this to filter for temperament and size compatibility.",
        type:"multi_select",
        options:[
          { icon:"👶", name:"Family with young children",      desc:"Need patient, gentle, sturdy breeds",             mira:hasChildren },
          { icon:"🐕", name:"Other dogs in the home",          desc:"Pack compatibility — some breeds are better",     mira:multiPet },
          { icon:"🐈", name:"Cats or other pets",              desc:"Prey drive matters for multi-pet homes" },
          { icon:"🏢", name:"Apartment living",                desc:"Size and energy level need to match the space" },
          { icon:"🏠", name:"House with garden",               desc:"More space — more breed options open up" },
          { icon:"💼", name:"Work away from home 8+ hours",   desc:"Some breeds handle alone time better than others" },
        ],
      },
      step3:{
        title:"Breed preferences",
        desc:"Honest preferences — Mira will tell you if they conflict with your lifestyle.",
        type:"multi_select",
        options:[
          { icon:"🐕", name:"Indie (Indian Pariah)",            desc:"Hardy, intelligent, low-maintenance — highly adaptable", mira:true },
          { icon:"🐩", name:"Small breed (under 10kg)",         desc:"Easier for apartments, lower exercise needs" },
          { icon:"🐕‍🦺", name:"Medium breed (10-25kg)",          desc:"Versatile — most environments work" },
          { icon:"🦮", name:"Large breed (25kg+)",              desc:"Need space and exercise — lots of love" },
          { icon:"🐾", name:"Senior dog (7+ years)",            desc:"Calmer, already trained, give a second chance" },
          { icon:"🧡", name:"Breed doesn't matter — right match", desc:"Personality and compatibility over appearance" },
        ],
      },
      step4:{
        title:"Your Breed Match Plan",
        summaryFields:["Your lifestyle","Family situation","Breed preferences","Next step"],
        cta:"🔍 Hand to Concierge®",
        conciergeNote:"Your Concierge® will prepare a breed match report and connect you with ethical adoption centres for the recommended breed.",
      },
    },
    {
      id:"readiness",
      icon:"✅", iconBg:"#E8F5E9", accentColor:"#2D6A4F", accentBg:"#E8F5E9", accentBorder:"#A5D6A7",
      badgeBg:"#2D6A4F", badge:"Are you ready?",
      photoBg:"linear-gradient(135deg,#E8F5E9,#C8E6C9)",
      title:"Adoption Readiness Path",
      desc:"An honest assessment of home, lifestyle, finances, and family alignment — before you fall in love with a dog.",
      stepLabels:["Home situation","Financial readiness","Time and lifestyle","Your readiness plan"],
      miraNote:"Most failed adoptions could have been prevented with honest preparation. This path isn't about whether you love dogs — it's about whether you're ready for this specific dog, right now.",
      step1:{
        title:"Your home situation",
        desc:"Practical reality — Mira will tell you if anything needs fixing before adopting.",
        type:"multi_select",
        options:[
          { icon:"🏠", name:"Space — enough room for a dog",           desc:"Every dog needs a designated space to feel safe" },
          { icon:"🔒", name:"Secure — fenced garden or safe balcony",  desc:"Escape prevention — especially for first weeks" },
          { icon:"🏢", name:"Housing approval confirmed",               desc:"Landlord or society has approved a dog" },
          { icon:"🧹", name:"Dog-proofing done or planned",            desc:"Cables, chemicals, sharp items secured" },
        ],
      },
      step2:{
        title:"Financial readiness",
        desc:"The honest cost of a dog in India — Mira wants you to go in prepared.",
        type:"select_one",
        miraPick:"Comfortable — can handle unexpected vet bills",
        options:[
          { icon:"✅", name:"Comfortable — can handle unexpected vet bills",  desc:"₹15,000-80,000 emergency range — covered",             mira:true },
          { icon:"📋", name:"Planned — budgeted ₹2,000-5,000/month",         desc:"Food, grooming, vet, insurance monthly" },
          { icon:"❓", name:"Unsure — haven't fully costed it",               desc:"Mira will give you the real monthly breakdown" },
          { icon:"💰", name:"Tight — will need to plan carefully",            desc:"There are lower-cost options — Indie adoption is free" },
        ],
      },
      step3:{
        title:"Time and lifestyle commitment",
        desc:"Dogs need time every day — not just when it's convenient.",
        type:"multi_select",
        options:[
          { icon:"🌅", name:"Morning routine (30+ min walk)",         desc:"Every day, rain or shine",                              mira:true },
          { icon:"🌙", name:"Evening routine (30+ min walk)",          desc:"Consistent schedule helps dogs settle" },
          { icon:"🏠", name:"Not alone more than 4-6 hours",          desc:"Separation anxiety is real and serious" },
          { icon:"🏥", name:"Annual vet visits planned",              desc:"Wellness check + vaccinations each year" },
          { icon:"📚", name:"Willing to do basic training",           desc:"Sit, stay, recall — 10 minutes a day for first 3 months" },
        ],
      },
      step4:{
        title:"Your Adoption Readiness Plan",
        summaryFields:["Home situation","Financial readiness","Time commitment","Next step"],
        cta:"✅ Hand to Concierge®",
        conciergeNote:"Your Concierge® will review the readiness assessment and identify anything to address before proceeding.",
      },
    },
    {
      id:"home_prep",
      icon:"🏡", iconBg:"#FFF8E1", accentColor:"#C9973A", accentBg:"#FFF8E1", accentBorder:"#FFE082",
      badgeBg:"#C9973A", badge:"Prepare home",
      photoBg:"linear-gradient(135deg,#FFF8E1,#FFE082)",
      title:"Home Preparation Path",
      desc:`Everything to do before ${name || 'your dog'} arrives home — safety, setup, supplies, routine.`,
      stepLabels:["Dog-proofing audit","The must-have supplies","Space and routine setup","Your home preparation plan"],
      miraNote:"The first hour home sets the tone for the first month. A prepared home means a calmer dog and a less stressed family. I'll walk you through everything.",
      step1:{
        title:"Dog-proofing audit",
        desc:"Check every room — Mira knows what dogs get into.",
        type:"multi_select",
        options:[
          { icon:"🔌", name:"Cables and wires secured",              desc:"Puppy-proof — every cable out of reach" },
          { icon:"🧪", name:"Cleaning products locked away",         desc:"Under-sink cabinets — completely inaccessible" },
          { icon:"🌿", name:"Toxic plants removed",                  desc:"Pothos, lilies, aloe — dogs chew everything" },
          { icon:"🚪", name:"Safe room identified",                  desc:"A quiet space for first days — not the whole house" },
          { icon:"🏡", name:"Garden/balcony secured",                desc:"No gap larger than 10cm for a determined dog" },
          { icon:"🗑️", name:"Bins with lids or secured",            desc:"Food waste smells irresistible — dogs tip bins" },
        ],
      },
      step2:{
        title:"The must-have supplies for day one",
        desc:"Only the essentials for the first week — don't over-buy before you know the dog.",
        type:"multi_select",
        options:[
          { icon:"🛏️", name:"Comfortable bed or crate",              desc:"Safe space that smells of you — most important item",    mira:true },
          { icon:"🥣", name:"Food and water bowls",                  desc:"Stainless or ceramic — not plastic" },
          { icon:"🦮", name:"Collar, tag, and lead",                 desc:"Fitted collar with ID tag before they leave the car" },
          { icon:"🐕", name:"First food supply (same as shelter)",   desc:"Change food gradually — first week use shelter food" },
          { icon:"🧹", name:"Cleaning supplies",                     desc:"Enzymatic cleaner for accidents — regular cleaner doesn't work" },
          { icon:"🎾", name:"Two or three toys",                     desc:"Don't overwhelm — a few good ones to start" },
        ],
      },
      step3:{
        title:"Space and routine setup",
        desc:"Routine is the fastest way to help a new dog settle.",
        type:"multi_select",
        options:[
          { icon:"📅", name:"Feeding schedule planned",              desc:"Same time every day — bowls down 20 min then up", mira:true },
          { icon:"🌅", name:"Walk schedule decided",                 desc:"Morning and evening — same times every day" },
          { icon:"🛁", name:"Grooming plan",                         desc:"First groom — when, where, how often for the breed" },
          { icon:"🏥", name:"First vet appointment booked",          desc:"Within 48 hours of adoption — health check and relationship" },
          { icon:"📚", name:"Training plan started",                 desc:"Sit, stay, name — 10 minutes twice a day from day one" },
        ],
      },
      step4:{
        title:"Your Home Preparation Plan",
        summaryFields:["Dog-proofing","Must-have supplies","Routine setup","Next step"],
        cta:"🏡 Hand to Concierge®",
        conciergeNote:"Your Concierge® will source the supplies, arrange the first vet appointment, and prepare the first-week routine guide.",
      },
    },
    {
      id:"first_30_days",
      icon:"🐾", iconBg:"#FCE4EC", accentColor:"#C2185B", accentBg:"#FCE4EC", accentBorder:"#F48FB1",
      badgeBg:G.mauve, badge:"Most important",
      photoBg:"linear-gradient(135deg,#FCE4EC,#F8BBD9)",
      title:"First 30 Days Path",
      desc:`The most critical month in any adoption — settle, bond, establish, and set ${name || 'your dog'} up for life.`,
      stepLabels:["Week one priorities","Vet and health","Training foundations","Your first 30 days plan"],
      miraNote:"Most adoption returns happen in the first 30 days — not because the dog is wrong, but because the transition isn't managed well. I'll walk you through every week.",
      step1:{
        title:"Week one priorities",
        desc:"The first week is about settling in — not training, not showing off, just safety.",
        type:"multi_select",
        options:[
          { icon:"🏠", name:"The 3-3-3 rule",                         desc:"3 days to decompress, 3 weeks to learn routine, 3 months to feel home", mira:true },
          { icon:"🔇", name:"Quiet time — limited visitors",           desc:"No parties or introductions in week one" },
          { icon:"🍽️", name:"Same food as the shelter",               desc:"Change food gradually after week one" },
          { icon:"🐕", name:"Short, calm walks only",                 desc:"No dog parks or busy areas until settled" },
          { icon:"🛏️", name:"Sleeping space established",             desc:"Crate or bed — consistent location from day one" },
        ],
      },
      step2:{
        title:"Vet and health — first month",
        desc:"Everything health-related to arrange in the first 30 days.",
        type:"multi_select",
        options:[
          { icon:"🏥", name:"First vet check (within 48 hours)",       desc:"Health baseline, microchip check, existing conditions", mira:true },
          { icon:"💉", name:"Vaccination schedule confirmed",           desc:"Which vaccines are due and when" },
          { icon:"🦠", name:"Deworming treatment",                      desc:"Most rescue dogs need immediate deworming" },
          { icon:"🦟", name:"Flea and tick treatment",                  desc:"Apply before entering the home" },
          { icon:"🔬", name:"Microchip and registration",              desc:"Chip confirmed, registry updated to new owner" },
        ],
      },
      step3:{
        title:"Training foundations — first month",
        desc:"Four things. That's it. Everything else can wait.",
        type:"multi_select",
        options:[
          { icon:"📛", name:"Name recognition",                         desc:"Respond to name reliably — 5 minutes a day", mira:true },
          { icon:"🚽", name:"Toilet training",                          desc:"Same spot, same schedule — praise immediately" },
          { icon:"🛑", name:"Sit and stay",                            desc:"Foundation for all future training" },
          { icon:"📞", name:"Recall (come)",                           desc:"Most important safety command — practice daily" },
          { icon:"😴", name:"Crate training",                          desc:"Safe space — not punishment — for life" },
        ],
      },
      step4:{
        title:"Your First 30 Days Plan",
        summaryFields:["Week one approach","Vet and health","Training foundations","Next step"],
        cta:"🐾 Hand to Concierge®",
        conciergeNote:"Your Concierge® will book the first vet appointment, prepare the week-by-week guide, and be on call for questions throughout the first month.",
      },
    },
    {
      id:"rescue_dog",
      icon:"💛", iconBg:"#FFF3E0", accentColor:"#E65100", accentBg:"#FFF3E0", accentBorder:"#FFCC02",
      badgeBg:"#E65100", badge:"Rescue-specific",
      photoBg:"linear-gradient(135deg,#FFF3E0,#FFE0B2)",
      title:"Rescue Dog Path",
      desc:`Trauma-aware care for ${name || 'your rescue dog'} — understanding what they've been through and how to help them heal.`,
      stepLabels:["Understanding their history","Signs to watch for","Building trust","Your rescue dog plan"],
      miraNote:`${isRescue?"Rescue dogs carry their past with them — sometimes for a long time. ":""} Every behaviour you see in a rescue dog is communication. I will help you understand what ${name || "this dog"} is telling you.`,
      step1:{
        title:"Understanding what your rescue dog may have been through",
        desc:"Knowing the background helps you respond correctly — not personally.",
        type:"multi_select",
        options:[
          { icon:"🏚️", name:"Street dog / stray background",           desc:"Resourceful, independent, may be wary of indoor life" },
          { icon:"😰", name:"History of abuse or neglect",             desc:"Slow trust, fear responses, specific triggers" },
          { icon:"🏥", name:"Medical trauma or past illness",          desc:"Vet visits may cause anxiety — go slowly" },
          { icon:"🐕", name:"Multiple homes or returns",               desc:"May test you — consistency is the cure" },
          { icon:"❓", name:"History unknown",                         desc:"Watch behaviour — it tells you everything you need to know" },
        ],
      },
      step2:{
        title:"Signs to watch for in the first weeks",
        desc:"These are normal — not reasons to worry. Knowing them reduces panic.",
        type:"multi_select",
        options:[
          { icon:"🔇", name:"Shutting down (hiding, not eating)",      desc:"Overwhelm — reduce stimulation, give space", mira:true },
          { icon:"🌊", name:"Flooding (hyperactive, clingy)",          desc:"Anxiety response — calm, consistent routine helps" },
          { icon:"🚽", name:"Regression in toilet training",           desc:"Common with stress — not a permanent problem" },
          { icon:"😤", name:"Resource guarding (food, space, toys)",   desc:"Insecurity — work with a behaviourist" },
          { icon:"🌙", name:"Night anxiety or howling",                desc:"Unknown sounds, new smells — white noise helps" },
        ],
      },
      step3:{
        title:"Building trust — the rescue dog approach",
        desc:"Trust is earned through predictability. Same actions, same time, every day.",
        type:"multi_select",
        options:[
          { icon:"📅", name:"Complete routine from day one",            desc:"Same times for everything — they learn to predict you",     mira:true },
          { icon:"🤲", name:"Let them come to you",                    desc:"No forced cuddles — let them choose contact" },
          { icon:"🎾", name:"Play as trust-building",                  desc:"Play reveals personality — follow their lead" },
          { icon:"🧠", name:"Behaviourist consultation",               desc:"For specific fear responses — professional guidance matters" },
          { icon:"⏳", name:"The 3-3-3 rule — strictly",              desc:"3 days, 3 weeks, 3 months — trust this timeline" },
        ],
      },
      step4:{
        title:"Your Rescue Dog Plan",
        summaryFields:["Their background","Signs to watch for","Trust-building approach","Next step"],
        cta:"💛 Hand to Concierge®",
        conciergeNote:"Your Concierge® will connect you with a rescue-experienced behaviourist and prepare the trauma-aware care guide specific to this dog's background.",
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
  const safePetName = pet?.name || 'your dog';
  const completeStep=(step)=>{ if(!completedSteps.includes(step))setCompletedSteps(prev=>[...prev,step]); if(step<totalSteps)setCurrentStep(step+1); };
  const handleSel1=(val)=>{ if(path.step1.type==="confirm_condition"){setSelections(prev=>({...prev,step1:[val]}));}else{setSelections(prev=>{const cur=prev.step1;return{...prev,step1:cur.includes(val)?cur.filter(v=>v!==val):[...cur,val]};});}};
  const handleSel2=(val)=>setSelections(prev=>({...prev,step2:val}));
  const handleSel3=(val)=>setSelections(prev=>{const cur=prev.step3;if(path.step3.type==="select_one")return{...prev,step3:[val]};return{...prev,step3:cur.includes(val)?cur.filter(v=>v!==val):[...cur,val]};});
  const handleSubmit = () => {
    guidedPathComplete({
      pathTitle: path?.title || "Adopt Path",
      pillar: "adopt",
      pet,
      channel: "adopt_guided_paths_complete",
      selections,
      onSuccess: () => setSubmitted(true),
    });
    setSubmitted(true);
  };

  if(submitted)return(<ModalShell onClose={onClose} noPadding><div style={{ background:`linear-gradient(135deg,${G.deep},${G.mid})`, borderRadius:20, padding:"48px 40px", textAlign:"center", minHeight:320, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}><div style={{ width:64, height:64, borderRadius:"50%", background:`linear-gradient(135deg,${path.accentColor},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:20 }}>♥</div><div style={{ fontSize:22, fontWeight:800, color:"#fff", fontFamily:"Georgia,serif", marginBottom:10 }}>{path.title.replace(" Path","")} sent to your Concierge®.</div><div style={{ fontSize:14, color:"rgba(255,255,255,0.55)", marginBottom:28, lineHeight:1.6 }}>Everything is in good hands.<br/>Your Concierge® will reach out within 48 hours. ♥</div><button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.20)", color:"#fff", borderRadius:20, padding:"10px 24px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Done</button></div></ModalShell>);

  if(currentStep===4&&completedSteps.includes(3)){
    const summaryData={[path.step4.summaryFields[0]]:selections.step1.join(", ")||"Not specified",[path.step4.summaryFields[1]]:selections.step2||"Not selected",[path.step4.summaryFields[2]]:selections.step3.join(", ")||"Not selected",[path.step4.summaryFields[3]]:"Concierge® will contact within 48h"};
    return(<ModalShell onClose={onClose}><div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}><div style={{ width:44, height:44, borderRadius:10, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{path.icon}</div><div><div style={{ fontSize:17, fontWeight:800, color:"#1A0A00", fontFamily:"Georgia,serif" }}>{path.title.replace(" Path",` for ${safePetName}`)}</div><div style={{ fontSize:12, color:"#888", marginTop:2 }}>{path.step4.summaryFields.join(" · ")} · All confirmed</div></div><button onClick={onClose} style={{ marginLeft:"auto", background:"#F5F5F5", border:"none", borderRadius:"50%", width:32, height:32, fontSize:16, cursor:"pointer", color:"#555" }}>✕</button></div><div style={{ background:"#fff", border:"1px solid #F0E8E0", borderRadius:14, marginBottom:20, overflow:"hidden" }}>{Object.entries(summaryData).map(([k,v],i)=>(<div key={k} style={{ display:"flex", alignItems:"flex-start", padding:"14px 18px", borderBottom:i<Object.entries(summaryData).length-1?"1px solid #F5F0EA":"none" }}><div style={{ fontSize:13, fontWeight:700, color:path.accentColor, width:160, flexShrink:0 }}>{k}</div><div style={{ fontSize:13, color:"#1A0A00", flex:1, lineHeight:1.5 }}>{v}</div></div>))}</div><button onClick={handleSubmit} style={{ width:"100%", background:`linear-gradient(135deg,${path.accentColor},${G.mid})`, color:"#fff", border:"none", borderRadius:14, padding:"16px", fontSize:16, fontWeight:800, cursor:"pointer", marginBottom:10 }}>{path.step4.cta}</button><div style={{ fontSize:12, color:"#888", textAlign:"center" }}>{path.step4.conciergeNote}</div></ModalShell>);
  }

  return(<ModalShell onClose={onClose}><div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}><div style={{ display:"flex", alignItems:"center", gap:12 }}><div style={{ width:44, height:44, borderRadius:10, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{path.icon}</div><div><div style={{ fontSize:17, fontWeight:800, color:"#1A0A00", fontFamily:"Georgia,serif" }}>{path.title.replace(" Path",` for ${safePetName}`)}</div><div style={{ fontSize:12, color:"#888", marginTop:2 }}>{totalSteps} steps. One complete plan.</div></div></div><button onClick={onClose} style={{ background:"#F5F5F5", border:"none", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:600, color:"#555", cursor:"pointer" }}>Close</button></div>
  <div style={{ background:`${path.accentColor}12`, border:`1px solid ${path.accentColor}30`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:10, marginBottom:22 }}><div style={{ width:28, height:28, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", flexShrink:0 }}>✦</div><div><div style={{ fontSize:13, color:"#1A0A00", fontStyle:"italic", lineHeight:1.55 }}>{path.miraNote}</div><div style={{ fontSize:11, color:path.accentColor, fontWeight:600, marginTop:3 }}>♥ Mira knows {safePetName}</div></div></div>
  <StepIndicator steps={path.stepLabels} currentStep={currentStep} completedSteps={completedSteps} accentColor={path.accentColor}/>
  {currentStep===1&&(<div><div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step1.title}</div><div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step1.desc}</div>{path.step1.type==="multi_select"?(<>{path.step1.options.map(opt=><OptionRow key={opt.name||opt} option={opt} selected={selections.step1.includes(opt.name||opt)} onSelect={handleSel1} accentColor={path.accentColor}/>)}<button onClick={()=>selections.step1.length>0&&completeStep(1)} style={{ marginTop:8, background:selections.step1.length>0?`linear-gradient(135deg,${path.accentColor},${G.mid})`:"#E0D8D0", color:selections.step1.length>0?"#fff":"#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:selections.step1.length>0?"pointer":"not-allowed" }}>Confirm →</button></>):(<>{path.step1.options.map(opt=><OptionRow key={opt.name||opt} option={typeof opt==="string"?{name:opt}:opt} selected={selections.step1.includes(opt.name||opt)||(opt.name||opt)===path.step1.confirmed} onSelect={handleSel1} accentColor={path.accentColor}/>)}<button onClick={()=>{if(!selections.step1.length&&path.step1.confirmed)setSelections(prev=>({...prev,step1:[path.step1.confirmed]}));completeStep(1);}} style={{ marginTop:8, background:`linear-gradient(135deg,${path.accentColor},${G.mid})`, color:"#fff", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:"pointer" }}>Confirm →</button></>)}</div>)}
  {currentStep===2&&(<div><div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step2.title}</div><div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step2.desc}</div>{path.step2.options.map(opt=><OptionRow key={opt.name} option={opt} selected={selections.step2===opt.name} onSelect={handleSel2} accentColor={path.accentColor}/>)}<button onClick={()=>selections.step2&&completeStep(2)} style={{ marginTop:8, background:selections.step2?`linear-gradient(135deg,${path.accentColor},${G.mid})`:"#E0D8D0", color:selections.step2?"#fff":"#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:selections.step2?"pointer":"not-allowed" }}>Confirm →</button></div>)}
  {currentStep===3&&(<div><div style={{ fontSize:15, fontWeight:700, color:"#1A0A00", marginBottom:4 }}>{path.step3.title}</div><div style={{ fontSize:13, color:"#888", lineHeight:1.55, marginBottom:16 }}>{path.step3.desc}</div>{path.step3.options.map(opt=><OptionRow key={opt.name} option={opt} selected={selections.step3.includes(opt.name)} onSelect={handleSel3} accentColor={path.accentColor}/>)}<button onClick={()=>selections.step3.length>0&&completeStep(3)} style={{ marginTop:8, background:selections.step3.length>0?`linear-gradient(135deg,${path.accentColor},${G.mid})`:"#E0D8D0", color:selections.step3.length>0?"#fff":"#999", border:"none", borderRadius:10, padding:"11px 24px", fontSize:13, fontWeight:700, cursor:selections.step3.length>0?"pointer":"not-allowed" }}>See {safePetName}'s Plan →</button></div>)}
  </ModalShell>);
}

// ─── EXPORT ──────────────────────────────────────────────────
function PathCard({ path, pet, onOpen }) {
  const petName = pet?.name || 'your dog';
  return (
    <div onClick={onOpen}
      style={{ background:'#fff', borderRadius:16, border:`2px solid rgba(212,83,126,0.14)`, padding:'20px', cursor:'pointer', transition:'all 0.18s', ...(path.miraPick?{boxShadow:`0 4px 20px ${path.accentColor}25`}:{}) }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 24px ${path.accentColor}20`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow=path.miraPick?`0 4px 20px ${path.accentColor}25`:'none';}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
        <div style={{width:50,height:50,borderRadius:14,background:path.iconBg||'#FDF2F8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>{path.icon}</div>
        {path.badge&&<span style={{fontSize:9,fontWeight:700,padding:'3px 9px',borderRadius:20,background:path.badgeBg||path.accentColor,color:'#fff',flexShrink:0}}>{path.badge}</span>}
      </div>
      <div style={{fontSize:15,fontWeight:800,color:G.darkText,marginBottom:6,fontFamily:'Georgia,serif'}}>{path.title}</div>
      <div style={{fontSize:13,color:'#888',lineHeight:1.6,marginBottom:14}}>{path.desc}</div>
      <div style={{display:'flex',gap:5,marginBottom:12}}>
        {(path.stepLabels||[]).map((label,i)=>(
          <div key={i} style={{flex:1}}>
            <div style={{height:3,borderRadius:3,marginBottom:3,background:i===0?path.accentColor:'rgba(212,83,126,0.15)'}}/>
            <div style={{fontSize:9,color:'#aaa',textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:13,color:path.accentColor,fontWeight:700}}>Start for {petName} →</div>
    </div>
  );
}

export default function GuidedAdoptPaths({ pet }) {
  const [activePath,setActivePath]=useState(null);
  const allPaths=buildPaths(pet);
  const activePathData=allPaths.find(p=>p.id===activePath);
  const petName=pet?.name||'your dog';
  return (
    <section style={{marginBottom:36}}>
      <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:6}}>
        <h3 style={{fontSize:'clamp(1.125rem,2.5vw,1.375rem)',fontWeight:800,color:G.darkText,margin:0,fontFamily:'Georgia,serif'}}>Guided Adoption Paths</h3>
        <span style={{fontSize:11,background:`linear-gradient(135deg,${G.rose||'#D4537E'},${G.mid||'#7B1D4E'})`,color:'#fff',borderRadius:20,padding:'2px 10px',fontWeight:700}}>{allPaths.length} paths</span>
      </div>
      <p style={{fontSize:13,color:'#888',marginBottom:20,lineHeight:1.5}}>Step-by-step adoption guidance arranged by Concierge® — each personalised for {petName}.</p>
      <div style={{display:'grid',gap:14}} className="gap-grid">
        <style>{`.gap-grid{grid-template-columns:1fr}@media(min-width:480px){.gap-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(min-width:960px){.gap-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}`}</style>
        {allPaths.map(path=><PathCard key={path.id} path={path} pet={pet} onOpen={()=>setActivePath(path.id)}/>)}
      </div>
      {activePath&&activePathData&&<PathFlowModal path={activePathData} pet={pet} onClose={()=>setActivePath(null)}/>}
    </section>
  );
}
