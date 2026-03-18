/**
 * GuidedPlayPaths.jsx — /play pillar
 * Mirrors GuidedGoPaths.jsx — 6 play paths, all showing by default
 * POST /api/concierge/play-path
 * body: { petId, pathId, selections }
 */
import { useState } from "react";
import { API_URL } from "../../utils/api";

const G = {
  deep:"#7B2D00", mid:"#7B3F00", green:"#E76F51",
  light:"#FFAD9B", pale:"#FFF0EA", cream:"#FFF8F5",
  darkText:"#7B2D00", mutedText:"#8B4513",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

function getPetEnergy(pet) { return pet?.doggy_soul_answers?.energy_level || null; }
function getPetSize(pet)   { return pet?.doggy_soul_answers?.size || pet?.size || null; }
function getHealth(pet) {
  const h = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
  if (!h) return null;
  const s = Array.isArray(h)?h.join(", "):String(h);
  return s.toLowerCase()==="none"||s.trim()===""?null:s;
}
function getAge(pet) { return parseInt(pet?.doggy_soul_answers?.age_years||"0")||0; }

function buildPaths(pet) {
  const petName = pet?.name || "your dog";
  const energy  = getPetEnergy(pet);
  const size    = getPetSize(pet);
  const health  = getHealth(pet);
  const age     = getAge(pet);
  const senior  = age >= 7;
  const breed   = (pet?.breed || pet?.doggy_soul_answers?.breed || "").split("(")[0].trim();

  return [
    {
      id:"park_day", icon:"🌳",
      title:"Park & Playdate Path", badge:"Mira Pick", badgeBg:G.mid,
      accentColor:"#7B3F00", accentBorder:"#2D6A4F20", accentBg:"#FFF0EA",
      iconBg:"#FFAD9B", photoBg:`linear-gradient(135deg,#D8F3DC,#95D5B2)`,
      desc:`Find the right park, set up a playdate, and give ${petName} the social life they deserve.`,
      miraNote: size ? `I know parks near you with ${size.toLowerCase()} dog sections and off-lead areas.` : `I'll find the best parks and playdates for ${petName}'s energy and personality.`,
      stepLabels:["Energy & park type","Who's joining","What to bring","Book or plan"],
      steps:{
        step1:{q:"How active is "+petName+" at the park?",type:"single",opts:["Calm — sniffs and wanders","Moderate — plays but tires","High energy — runs the whole time","Depends on who's there"]},
        step2:{q:"What kind of park day?",type:"single",opts:["Just us — solo outing","One-on-one playdate","Group meetup","Breed-specific playdate"]},
        step3:{q:"What to bring?",type:"multi",opts:["Water & collapsible bowl","Treats","Longline lead","Fetch toy","Poop bags","First aid kit","All of the above"]},
        step4:{q:"Want Mira to find parks near you?",type:"single",opts:["Yes — find parks now","Yes — and coordinate a playdate","Just a shopping list please","I have a park — just help me plan"]},
      },
    },
    {
      id:"dog_walking", icon:"🦮",
      title:"Dog Walking Path", badge:"Daily routine", badgeBg:"#E76F51",
      accentColor:"#E76F51", accentBorder:"#E76F5120", accentBg:"#FFF3EE",
      iconBg:"#FFD6C8", photoBg:"linear-gradient(135deg,#FFF3EE,#FFD6C8)",
      desc:`Build the right walking routine for ${petName} — distance, pace, frequency, and whether to book a professional walker.`,
      miraNote: energy === "high"
        ? `${petName} has high energy — I'll build a walking programme that actually tires them out.`
        : senior ? `${petName} is a senior dog — gentle, consistent walks are better than long exhausting ones.`
        : `The right walking routine changes everything. I'll build one matched to ${petName}'s age, size, and energy.`,
      stepLabels:["Walk style & pace","Frequency & duration","Any challenges","Walking support"],
      steps:{
        step1:{q:"What kind of walker is "+petName+"?",type:"single",opts:["Calm — enjoys sniffing","Brisk — good steady pace","Runner — loves to go fast","Reactive — needs careful handling"]},
        step2:{q:"How often are you walking?",type:"single",opts:["Daily","Every other day","A few times a week","Irregularly — need more structure"]},
        step3:{q:"Any challenges?",type:"multi",opts:["Pulls on lead","Reactive to other dogs","Scared of traffic","Doesn't want to walk","Overheats quickly","All good — just want a plan"]},
        step4:{q:"Walking support needed?",type:"single",opts:["Self-walk tips & routine","Book a professional dog walker","Running partner needed","All three — Mira builds the plan"]},
      },
    },
    {
      id:"fitness_plan", icon:"💪",
      title:"Fitness & Training Path", badge:"Mira builds plan", badgeBg:"#7B2D00",
      accentColor:"#7B2D00", accentBorder:"#1B433220", accentBg:"#E8F5E9",
      iconBg:"#C8E6C9", photoBg:"linear-gradient(135deg,#E8F5E9,#A5D6A7)",
      desc:`Mira builds a personalised 4-week fitness plan for ${petName} — matched to their age, health, and goals.`,
      miraNote: health
        ? `I've noted ${petName}'s ${health}. Every exercise here is safe and appropriate.`
        : senior ? `Senior dogs benefit from low-impact movement. I'll build a gentle programme that keeps ${petName} mobile.`
        : `The right fitness plan changes a dog's whole quality of life. Tell me the goal and I'll build the programme.`,
      stepLabels:["Fitness goal","Current activity level","Health check","Programme type"],
      steps:{
        step1:{q:"What's the fitness goal?",type:"single",opts:["General health & vitality","Weight loss — vet recommended","Build muscle & stamina","Senior mobility & comfort","Agility sport prep","Post-surgery recovery"]},
        step2:{q:"Current activity level?",type:"single",opts:["Barely any exercise","Short walks only","Moderate — 2-3 walks/day","Very active — needs more structure"]},
        step3:{q:"Any health conditions?",type:"single",opts:["None — fully healthy","Joint issues / arthritis","Overweight by vet assessment","Post-surgery / recovering","Heart condition — vet-supervised only"]},
        step4:{q:"Which activities interest you?",type:"multi",opts:["Agility course","Nose work / scent training","Balance & core training","Weighted walks","Swimming","Treadmill sessions","All — let Mira decide"]},
      },
    },
    {
      id:"swimming_hydro", icon:"🏊",
      title:"Swimming & Hydro Path", badge:"Splashes & heals", badgeBg:"#1565C0",
      accentColor:"#1565C0", accentBorder:"#1565C020", accentBg:"#E3F2FD",
      iconBg:"#BBDEFB", photoBg:"linear-gradient(135deg,#E3F2FD,#90CAF9)",
      desc:`From first swim to hydrotherapy — find the right water activity for ${petName}'s health, breed, and confidence.`,
      miraNote:`${breed ? breed+"s" : "Dogs"} ${["Labrador","Golden Retriever","Spaniel"].some(b=>breed?.includes(b)) ? "are natural swimmers — " : "can learn to love swimming — "}I'll find the right session and make sure ${petName} is safe.`,
      stepLabels:["Swim experience","Why swimming","Safety check","Session type"],
      steps:{
        step1:{q:"Has "+petName+" swum before?",type:"single",opts:["Never — first time","Tried once or twice","Loves water — swims confidently","Professional hydrotherapy needed"]},
        step2:{q:"Why swimming?",type:"single",opts:["Fun & fitness","Weight management","Joint recovery / arthritis","Post-surgery rehabilitation","Beat the heat","Just to try it"]},
        step3:{q:"Safety equipment?",type:"single",opts:["Has a life jacket","Needs one — help me choose","Not sure about water confidence yet","Professional pool only — safety first"]},
        step4:{q:"Session preference?",type:"single",opts:["Open water / beach","Private pool session","Hydrotherapy centre","Home paddling pool","Mira recommends the best option"]},
      },
    },
    {
      id:"adventure_day", icon:"🌄",
      title:"Weekend Adventure Path", badge:"Go explore", badgeBg:"#C9973A",
      accentColor:"#C9973A", accentBorder:"#C9973A20", accentBg:"#FFFDE7",
      iconBg:"#FFE082", photoBg:"linear-gradient(135deg,#FFFDE7,#FFE082)",
      desc:`Plan the perfect day out with ${petName} — Mira researches the route, rest stops, and what to pack.`,
      miraNote:`Tell me the adventure and I'll research the route, find pet-friendly stops, and build ${petName}'s perfect day out kit.`,
      stepLabels:["Adventure type","Distance & pace","Who's coming","Pack list"],
      steps:{
        step1:{q:"What kind of adventure?",type:"single",opts:["Beach day","Hill hike / mountain trail","Forest & nature walk","Lake or river day","City exploration","Camping overnight"]},
        step2:{q:"How far?",type:"single",opts:["Short & easy (under 3km)","Medium (3–8km)","Long (8km+)","Let Mira decide by breed & age"]},
        step3:{q:"Who's joining?",type:"single",opts:["Just me and "+petName,"Partner coming too","Kids joining us","Another dog too","Full group adventure"]},
        step4:{q:"What to prepare?",type:"multi",opts:["Route planning","Emergency vet en route","Pet-friendly cafe stops","First aid kit","Activity gear","Overnight pack","Mira handles everything"]},
      },
    },
    {
      id:"social_life", icon:"🤝",
      title:"Social & Events Path", badge:"Make friends", badgeBg:"#9B59B6",
      accentColor:"#9B59B6", accentBorder:"#9B59B620", accentBg:"#F3E5F5",
      iconBg:"#E1BEE7", photoBg:"linear-gradient(135deg,#F3E5F5,#CE93D8)",
      desc:`Build ${petName}'s social life — from playdates to pet events, Mira coordinates and plans everything.`,
      miraNote:`${petName}'s social life matters as much as their physical health. I'll find the right events and playmates for their personality.`,
      stepLabels:["Social experience","What kind of social","Social goal","Concerns"],
      steps:{
        step1:{q:"How social is "+petName+"?",type:"single",opts:["Never socialised properly","Limited — only known dogs","Good with most dogs","Fully social — loves everyone"]},
        step2:{q:"What kind of social?",type:"single",opts:["One-on-one playdate","Small group (3-5 dogs)","Dog park meetup","Breed-specific event","Pet-friendly festival or event","Virtual social first — just advice"]},
        step3:{q:"Social goal?",type:"single",opts:["Build confidence in "+petName,"Find a regular playmate","Get exercise through play","Reduce reactive behaviour","Human socialisation too","All of the above"]},
        step4:{q:"Any concerns?",type:"multi",opts:["Dog is reactive","Dog is shy or nervous","Owner is nervous too","Finding the right match","Unknown vaccination status","All good — let's go"]},
      },
    },
  ];
}

// ── Shared components ─────────────────────────────────────────
function StepIndicator({ current, total, accentColor }) {
  return (
    <div style={{ display:"flex", gap:6, marginBottom:20, justifyContent:"center" }}>
      {Array.from({length:total}).map((_,i) => (
        <div key={i} style={{ width:i===current-1?24:8, height:8, borderRadius:20, background:i<current?accentColor:"#E0E0E0", transition:"all 0.3s" }} />
      ))}
    </div>
  );
}

function OptionRow({ label, selected, onSelect }) {
  return (
    <div onClick={onSelect} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, border:`1.5px solid ${selected?"#E76F51":"#E8E0D8"}`, background:selected?"#FFF0EA":"#fff", cursor:"pointer", marginBottom:8, transition:"all 0.12s" }}>
      <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${selected?"#E76F51":"#ccc"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {selected && <div style={{ width:10, height:10, borderRadius:"50%", background:"#E76F51" }} />}
      </div>
      <span style={{ fontSize:13, color:G.darkText, fontWeight:selected?600:400 }}>{label}</span>
    </div>
  );
}

function PathFlowModal({ path, pet, onClose }) {
  const totalSteps = path.stepLabels.length;
  const [step, setStep]     = useState(1);
  const [sels, setSels]     = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending]     = useState(false);

  const stepData   = Object.values(path.steps).filter(Boolean)[step-1];
  const currentSel = sels[step];
  const hasAnswer  = currentSel && (Array.isArray(currentSel)?currentSel.length>0:String(currentSel).trim().length>0);

  const handleSelect = val => {
    if (!stepData) return;
    if (stepData.type==="multi") {
      setSels(p => { const c=p[step]||[]; return {...p,[step]:c.includes(val)?c.filter(v=>v!==val):[...c,val]}; });
    } else if (stepData.type!=="text") {
      setSels(p => ({...p,[step]:val}));
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await fetch(`${API_URL}/api/concierge/play-path`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ petId:pet?.id, pathId:path.id, selections:sels }),
      });
    } catch {}
    setSending(false); setSubmitted(true);
  };

  const Shell = ({children}) => (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"min(560px,100%)", maxHeight:"90vh", background:"#fff", borderRadius:20, overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 80px rgba(0,0,0,0.35)" }}>
        <div style={{ background:`linear-gradient(135deg,${path.accentColor},${path.accentColor}BB)`, padding:"20px 24px 16px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.20)", borderRadius:20, padding:"3px 10px" }}>
              <span style={{ fontSize:16 }}>{path.icon}</span>
              <span style={{ fontSize:12, color:"#fff", fontWeight:600 }}>{path.title}</span>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.20)", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", color:"#fff", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          </div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)" }}>{path.desc}</div>
        </div>
        {children}
      </div>
    </div>
  );

  if (submitted) return (
    <Shell>
      <div style={{ padding:"40px 32px", textAlign:"center", flex:1 }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${path.accentColor},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>{path.icon}</div>
        <div style={{ fontSize:22, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:8 }}>Sent to your Play Concierge.</div>
        <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.7, marginBottom:24 }}>Everything is in good hands.<br/>Your Concierge will reach out within 48 hours. ♥</div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:G.pale, border:`1px solid rgba(231,111,81,0.30)`, borderRadius:20, padding:"6px 16px", fontSize:13, color:G.mid, fontWeight:600, marginBottom:20 }}>📥 Added to your Inbox</div>
        <div><button onClick={onClose} style={{ background:path.accentColor, color:"#fff", border:"none", borderRadius:12, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>View in Concierge® Inbox</button></div>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div style={{ padding:"20px 24px", flex:1, overflowY:"auto" }}>
        <StepIndicator current={step} total={totalSteps} accentColor={path.accentColor} />
        <div style={{ background:G.pale, border:"1px solid rgba(231,111,81,0.22)", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"flex-start", gap:8, marginBottom:18 }}>
          <div style={{ width:22, height:22, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", flexShrink:0 }}>✦</div>
          <div style={{ fontSize:13, color:G.mid }}><strong>Mira knows:</strong> {path.miraNote}</div>
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:G.mutedText, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
          Step {step}: {path.stepLabels[step-1]}
        </div>
        {stepData && (
          <>
            <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:14 }}>{stepData.q?.replace(/{pet}/g, pet?.name||"your dog")}</div>
            {stepData.type==="multi"||stepData.type==="single"
              ? stepData.opts.map(opt => (
                  <OptionRow key={opt} label={opt}
                    selected={stepData.type==="multi"?(Array.isArray(currentSel)&&currentSel.includes(opt)):currentSel===opt}
                    onSelect={() => handleSelect(opt)} />
                ))
              : <textarea rows={4} placeholder={stepData.placeholder||"Type here…"} value={currentSel||""} onChange={e=>setSels(p=>({...p,[step]:e.target.value}))}
                  style={{ width:"100%", border:"1.5px solid rgba(231,111,81,0.25)", borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", boxSizing:"border-box" }} />}
          </>
        )}
      </div>
      <div style={{ padding:"16px 24px 20px", borderTop:"1px solid rgba(231,111,81,0.10)", display:"flex", gap:10, flexShrink:0 }}>
        {step>1 && (
          <button onClick={() => setStep(s=>s-1)} style={{ flex:1, background:"#fff", border:"1.5px solid rgba(231,111,81,0.20)", borderRadius:12, padding:"12px", fontSize:13, fontWeight:600, color:G.mutedText, cursor:"pointer" }}>← Back</button>
        )}
        {step<totalSteps
          ? <button onClick={() => hasAnswer||!stepData?setStep(s=>s+1):null} disabled={stepData&&!hasAnswer}
              style={{ flex:2, background:stepData&&!hasAnswer?"#E8E0D8":`linear-gradient(135deg,${G.orange},${G.mid})`, color:stepData&&!hasAnswer?"#999":"#fff", border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:800, cursor:stepData&&!hasAnswer?"not-allowed":"pointer" }}>
              Continue →
            </button>
          : <button onClick={handleSend} disabled={sending}
              style={{ flex:2, background:sending?"#E8E0D8":`linear-gradient(135deg,${path.accentColor},${path.accentColor}BB)`, color:sending?"#999":"#fff", border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:800, cursor:sending?"wait":"pointer" }}>
              {sending?"Sending…":"Hand to Concierge® →"}
            </button>}
      </div>
    </Shell>
  );
}

// ── MAIN EXPORT ──────────────────────────────────────────────
export default function GuidedPlayPaths({ pet }) {
  const [openPath,   setOpenPath]   = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [showAll,    setShowAll]    = useState(true);

  const allPaths = buildPaths(pet);
  const paths    = showAll ? allPaths : allPaths.slice(0, 3);

  return (
    <div style={{ marginBottom:32 }}>
      {activePath && (
        <PathFlowModal path={allPaths.find(p=>p.id===activePath)} pet={pet} onClose={() => setActivePath(null)} />
      )}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:4 }}>
        <div style={{ fontSize:20, fontWeight:800, color:G.deep, fontFamily:"Georgia,serif" }}>Guided Play Paths</div>
        <button onClick={() => setShowAll(!showAll)} style={{ background:"none", border:`1.5px solid ${G.light}`, borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:600, color:G.mid, cursor:"pointer" }}>
          {showAll?"Show less":`See all ${allPaths.length}`}
        </button>
      </div>
      <div style={{ fontSize:12, color:G.mutedText, marginBottom:18 }}>
        Mira picked {allPaths.length} paths for {pet?.name||"your dog"}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {paths.map(path => (
          <div key={path.id}>
            <div onClick={() => setOpenPath(openPath===path.id?null:path.id)}
              style={{ background:openPath===path.id?path.accentBg:"#fff", border:`1.5px solid ${openPath===path.id?path.accentBorder:"#F0E8E0"}`, borderRadius:openPath===path.id?"14px 14px 0 0":14, cursor:"pointer", overflow:"hidden", transition:"all 0.15s" }}>
              {openPath !== path.id && (
                <div style={{ height:64, background:path.photoBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:32, opacity:0.75 }}>{path.icon}</span>
                </div>
              )}
              <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{path.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:G.darkText }}>{path.title}</span>
                    <span style={{ background:path.badgeBg, color:"#fff", fontSize:10, fontWeight:700, borderRadius:20, padding:"2px 8px" }}>{path.badge}</span>
                  </div>
                  <div style={{ fontSize:12, color:"#555", lineHeight:1.5 }}>{path.desc}</div>
                </div>
                <span style={{ fontSize:16, color:"#ccc", flexShrink:0, transform:openPath===path.id?"rotate(90deg)":"none", transition:"transform 0.2s" }}>›</span>
              </div>
            </div>
            {openPath === path.id && (
              <div style={{ background:"#fff", border:`1.5px solid ${path.accentBorder}`, borderTop:"none", borderRadius:"0 0 14px 14px", padding:"16px 18px 20px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:path.accentColor, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Path Steps</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18 }}>
                  {path.stepLabels.map((label,i) => (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:26, height:26, borderRadius:"50%", border:`1.5px solid ${path.accentColor}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:path.accentColor, flexShrink:0 }}>{i+1}</div>
                      <span style={{ fontSize:13, color:G.darkText }}>{label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setOpenPath(null); setActivePath(path.id); }}
                  style={{ width:"100%", background:path.accentColor, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:14, fontWeight:700, cursor:"pointer" }}>
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
