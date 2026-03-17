/**
 * GuidedGoPaths.jsx — /go pillar guided paths
 * Mirrors GuidedCarePaths.jsx exactly — 6 go paths
 *
 * 6 Paths:
 *   1. First Flight Path      — Docs → Carrier → Calming → Airport day
 *   2. Road Trip Path         — Safety → Comfort → Feeding → Route plan
 *   3. Relocation Path        — Timeline → Docs → Transport → New home
 *   4. Beach & Resort Path    — Hotel discovery → Beach kit → Activities
 *   5. Weekend Getaway Path   — Destination → Stay → Pack → Go
 *   6. Emergency Travel Path  — Urgent docs → Emergency vet → Next steps
 *
 * WIRING:
 *   POST /api/concierge/go-path
 *   body: { petId, pathId, selections }
 *
 * Props: pet — pet object from usePillarContext
 */

import { useState } from "react";
import { API_URL } from "../../utils/api";

const G = {
  deep:"#0D3349", deepMid:"#1A5276", teal:"#1ABC9C", light:"#76D7C4",
  pale:"#D1F2EB", cream:"#E8F8F5", darkText:"#0D3349", mutedText:"#5D6D7E",
};

function getPetSize(pet) { return pet?.doggy_soul_answers?.size || pet?.size || null; }
function getTravelAnxiety(pet) {
  const t = pet?.doggy_soul_answers?.anxiety_triggers || pet?.anxietyTriggers || [];
  return (Array.isArray(t)?t:[t]).some(x=>x&&(String(x).toLowerCase().includes("car")||String(x).toLowerCase().includes("travel")));
}
function getHealthCondition(pet) {
  const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
  if (!raw) return null;
  const str = Array.isArray(raw)?raw.join(", "):String(raw);
  return str.toLowerCase()==="none"||str.trim()===""?null:str;
}
function capAll(arr) { return arr.map(a=>a.charAt(0).toUpperCase()+a.slice(1).toLowerCase()).join(", "); }

function buildPaths(pet) {
  const petName   = pet?.name || "your dog";
  const size      = getPetSize(pet);
  const anxious   = getTravelAnxiety(pet);
  const condition = getHealthCondition(pet);
  const breed     = (pet?.breed || pet?.doggy_soul_answers?.breed || "").split("(")[0].trim();

  return [
    {
      id: "first_flight",
      icon: "✈️",
      title: "First Flight Path",
      badge: anxious ? "Priority" : "Mira Pick",
      badgeBg: anxious ? "#C62828" : G.teal,
      accentColor: "#1565C0",
      accentBorder: "#1565C020",
      accentBg: "#E3F2FD",
      iconBg: "#BBDEFB",
      photoBg: "linear-gradient(135deg,#E3F2FD,#90CAF9)",
      desc: `${anxious ? `${petName} has travel anxiety — ` : ""}Complete first-flight preparation: documents, carrier sizing, calming protocol, and airport day plan.`,
      miraNote: size ? `${petName} is a ${size} dog — I know which carriers fit cabin requirements for this size.` : `I'll check airline requirements and match the right carrier for ${petName}.`,
      stepLabels: ["Documentation checklist", "Carrier selection & IATA check", "Calming protocol (3 days before)", "Airport day — step by step"],
      steps: {
        step1: { q:"Which documents do you need?", type:"multi", opts:["Health Certificate","Vaccination Records","Airline Pet Approval","NOC from Vet","Microchip Certificate","All — Mira handles"] },
        step2: { q:"Cabin or cargo?", type:"single", opts:["Cabin — under seat","Cargo — checked baggage","Not sure — Mira will advise","Pet relocation service"] },
        step3: { q:"Does "+petName+" get anxious while travelling?", type:"single", opts:["Yes — very anxious","Sometimes — mild anxiety","No — travels well","First time flying"] },
        step4: { q:"Airport assistance needed?", type:"single", opts:["Check-in support","Airport pickup/drop","Both","No thanks"] },
      },
    },
    {
      id: "road_trip",
      icon: "🚗",
      title: "Road Trip Path",
      badge: "Mira Pick",
      badgeBg: "#2E7D32",
      accentColor: "#2E7D32",
      accentBorder: "#2E7D3220",
      accentBg: "#E8F5E9",
      iconBg: "#C8E6C9",
      photoBg: "linear-gradient(135deg,#E8F5E9,#A5D6A7)",
      desc: `Complete road trip kit for ${petName}: safety harness, comfort setup, feeding plan, and route recommendations.`,
      miraNote: `I'll recommend the crash-tested harness for ${petName}'s size and plan rest stops every 2–3 hours.`,
      stepLabels: ["Safety gear (harness, barrier, GPS)", "Comfort setup (bed, calming, blanket)", "Feeding & hydration on the road", "Route planning & rest stops"],
      steps: {
        step1: { q:"How long is the journey?", type:"single", opts:["Under 3 hours","3–8 hours","8+ hours / overnight","Multiple days"] },
        step2: { q:"How does "+petName+" travel?", type:"single", opts:["Comfortable in car","Gets mildly anxious","Very anxious / car sick","Never been in a car before"] },
        step3: { q:"What do you need?", type:"multi", opts:["Safety harness","GPS tracker","Collapsible bowl","Portable bed","Calming chews","First aid kit","Cooling mat"] },
        step4: { q:"What kind of trip?", type:"single", opts:["Beach / coastal","Hills / mountains","City break","Camping / nature"] },
      },
    },
    {
      id: "relocation",
      icon: "📦",
      title: "Relocation Path",
      badge: "Mira Pick",
      badgeBg: "#6A1B9A",
      accentColor: "#6A1B9A",
      accentBorder: "#6A1B9A20",
      accentBg: "#F3E5F5",
      iconBg: "#E1BEE7",
      photoBg: "linear-gradient(135deg,#F3E5F5,#CE93D8)",
      desc: `Complete relocation coordination for ${petName} — documents, transport, and settling into the new home.`,
      miraNote: `Relocation is the most complex trip. Mira handles every step so ${petName} arrives safe and settled.`,
      stepLabels: ["Documentation & certificates", "Transport arrangement", "Moving day preparation", "Settling in at the new home"],
      steps: {
        step1: { q:"What kind of move?", type:"single", opts:["Domestic (within India)","International","City to city","Temporary (returning)"] },
        step2: { q:"Documents needed?", type:"multi", opts:["Health Certificate","Vaccination Records","Import/Export Permit","Microchip Certificate","Airline approval","All — Mira handles"] },
        step3: { q:"How will "+petName+" travel?", type:"single", opts:["By flight","By road (self-drive)","By train","Pet relocation service"] },
        step4: { q:"When is the move?", type:"single", opts:["Within 2 weeks","Within a month","In 2–3 months","No fixed date yet"] },
      },
    },
    {
      id: "beach_stay",
      icon: "🏖️",
      title: "Beach & Resort Path",
      badge: "Explore",
      badgeBg: "#00695C",
      accentColor: "#00695C",
      accentBorder: "#00695C20",
      accentBg: "#E0F2F1",
      iconBg: "#B2DFDB",
      photoBg: "linear-gradient(135deg,#E0F2F1,#80CBC4)",
      desc: `Pet-friendly hotel discovery, beach safety kit, and activity planning for ${petName}'s seaside escape.`,
      miraNote: `I'll find pet-friendly resorts that genuinely welcome ${breed||"your dog"}, not just tolerate them.`,
      stepLabels: ["Pet-friendly hotel discovery", "Beach safety kit (paw wax, sunscreen, cooling mat)", "Activity planning", "Vet & emergency contacts at destination"],
      steps: {
        step1: { q:"Destination?", type:"single", opts:["Goa","Kerala / Malabar","Andamans","Other coastal"] },
        step2: { q:"How many nights?", type:"single", opts:["Weekend (2–3 nights)","4–7 nights","8+ nights","Day trip only"] },
        step3: { q:"What do you need?", type:"multi", opts:["Pet-friendly hotel","Beach safety kit","Cooling mat","Paw wax for sand","Dog sunscreen","Water activity gear","Vet near destination"] },
        step4: { q:"Any special requirements?", type:"multi", opts:["No other pets at property","Pool access","Large outdoor space","Ground floor room","Near beach"] },
      },
    },
    {
      id: "weekend_getaway",
      icon: "🌄",
      title: "Weekend Getaway Path",
      badge: "Explore",
      badgeBg: G.teal,
      accentColor: G.teal,
      accentBorder: "#1ABC9C20",
      accentBg: G.pale,
      iconBg: G.light,
      photoBg: `linear-gradient(135deg,${G.pale},${G.light})`,
      desc: `Quick weekend trip with ${petName} — destination, stay, packing list, and Mira handles the details.`,
      miraNote: `A weekend getaway should be simple. Tell me where and when — Mira does the rest.`,
      stepLabels: ["Destination & dates", "Pet-friendly stay discovery", "Packing list for "+petName, "Concierge confirmation"],
      steps: {
        step1: { q:"Where are you going?", type:"single", opts:["Nearby hills","Beach destination","Another city","Countryside / farm stay"] },
        step2: { q:"Where will "+petName+" stay?", type:"single", opts:["Pet-friendly hotel","Boarding near destination","Sitter at home (I'll travel without them)","Not sure — help me decide"] },
        step3: { q:"Trip purpose?", type:"single", opts:["Rest & relax","Adventure & hiking","Cultural / city exploration","Event or occasion"] },
        step4: { q:"What do you need packed?", type:"multi", opts:["Travel bowl & water bottle","Calming chews","Comfort blanket","First aid kit","Poop bags","ID tag backup","All of the above"] },
      },
    },
    {
      id: "emergency_travel",
      icon: "🚨",
      title: "Emergency Travel Path",
      badge: "Urgent",
      badgeBg: "#C62828",
      accentColor: "#C62828",
      accentBorder: "#C6282820",
      accentBg: "#FFEBEE",
      iconBg: "#FFCDD2",
      photoBg: "linear-gradient(135deg,#FFEBEE,#EF9A9A)",
      desc: `Urgent help — lost ${petName}, missed flight, emergency vet abroad, or documentation problem. Mira acts immediately.`,
      miraNote: `This is the path for when things go wrong. Select your situation and we will call you within 5 minutes.`,
      stepLabels: ["Describe the emergency", "Your current location", "Immediate next steps — Mira calls you"],
      steps: {
        step1: { q:"What's the emergency?", type:"single", opts:["Lost pet","Emergency vet needed","Missed flight / stranded","Documentation rejected","Transport breakdown","Other urgent issue"] },
        step2: { q:"Where are you now?", type:"text", placeholder:"City, airport, address, or nearest landmark" },
        step3: { q:"How urgent is it?", type:"single", opts:["Right now — critical","Within the next hour","Within today","Tomorrow or later"] },
        step4: null,
      },
    },
  ];
}

// ── Path flow modal (mirrors GuidedCarePaths PathFlowModal) ──
function StepIndicator({ current, total, accentColor }) {
  return (
    <div style={{ display:"flex", gap:6, marginBottom:20, justifyContent:"center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === current - 1 ? 24 : 8, height:8, borderRadius:20, background: i < current ? accentColor : "#E0E0E0", transition:"all 0.3s" }} />
      ))}
    </div>
  );
}

function OptionRow({ label, selected, onSelect }) {
  return (
    <div onClick={onSelect} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:12, border:`1.5px solid ${selected?"#1ABC9C":"#E8E0D8"}`, background:selected?"#E8F8F5":"#fff", cursor:"pointer", marginBottom:8, transition:"all 0.12s" }}>
      <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${selected?"#1ABC9C":"#ccc"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {selected && <div style={{ width:10, height:10, borderRadius:"50%", background:"#1ABC9C" }} />}
      </div>
      <span style={{ fontSize:13, color:G.darkText, fontWeight:selected?600:400 }}>{label}</span>
    </div>
  );
}

function ModalShell({ path, onClose, children }) {
  return (
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
}

function PathFlowModal({ path, pet, onClose }) {
  const totalSteps = path.stepLabels.length;
  const [currentStep, setCurrentStep] = useState(1);
  const [selections, setSelections]   = useState({});
  const [submitted, setSubmitted]     = useState(false);
  const [sending, setSending]         = useState(false);

  const stepData = Object.values(path.steps).filter(Boolean)[currentStep - 1];
  const currentSel = selections[currentStep];
  const hasAnswer = currentSel && (Array.isArray(currentSel) ? currentSel.length > 0 : true);

  const handleSelect = val => {
    if (!stepData) return;
    if (stepData.type === "multi") {
      setSelections(prev => {
        const cur = prev[currentStep] || [];
        return { ...prev, [currentStep]: cur.includes(val) ? cur.filter(v=>v!==val) : [...cur, val] };
      });
    } else if (stepData.type !== "text") {
      setSelections(prev => ({ ...prev, [currentStep]: val }));
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await fetch(`${API_URL}/api/concierge/go-path`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petId: pet?.id, pathId: path.id, selections }),
      });
    } catch {}
    setSending(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <ModalShell path={path} onClose={onClose}>
      <div style={{ padding:"40px 32px", textAlign:"center", flex:1 }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${path.accentColor},${G.teal})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>{path.icon}</div>
        <div style={{ fontSize:22, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:8 }}>{path.title.replace(" Path","")} sent to your Concierge.</div>
        <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.7, marginBottom:24 }}>
          Everything is in good hands.<br/>Your Concierge will reach out within 48 hours.<br/>
          {path.id === "emergency_travel" && <><br/><span style={{ color:"#C62828", fontWeight:700 }}>We will call you within 5 minutes.</span></>}
        </div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:G.pale, border:`1px solid ${G.teal}40`, borderRadius:20, padding:"6px 16px", fontSize:13, color:G.teal, fontWeight:600, marginBottom:20 }}>📥 Added to your Inbox</div>
        <div><button onClick={onClose} style={{ background:path.accentColor, color:"#fff", border:"none", borderRadius:12, padding:"12px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}>View in Concierge® Inbox</button></div>
      </div>
    </ModalShell>
  );

  return (
    <ModalShell path={path} onClose={onClose}>
      <div style={{ padding:"20px 24px", flex:1, overflowY:"auto" }}>
        <StepIndicator current={currentStep} total={totalSteps} accentColor={path.accentColor} />

        {/* Mira note */}
        <div style={{ background:G.pale, border:`1px solid rgba(26,188,156,0.22)`, borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"flex-start", gap:8, marginBottom:18 }}>
          <span style={{ fontSize:14, flexShrink:0 }}>ⓘ</span>
          <div style={{ fontSize:13, color:G.deepMid }}><strong>Mira knows:</strong>{" "}{path.miraNote}</div>
        </div>

        <div style={{ fontSize:13, fontWeight:700, color:G.mutedText, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
          Step {currentStep}: {path.stepLabels[currentStep - 1]}
        </div>

        {stepData ? (
          <>
            <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:14 }}>{stepData.q?.replace(/{pet}/g, pet?.name || "your dog")}</div>
            {stepData.type === "multi" || stepData.type === "single" ? (
              stepData.opts.map(opt => (
                <OptionRow
                  key={opt}
                  label={opt}
                  selected={stepData.type === "multi" ? (Array.isArray(currentSel) && currentSel.includes(opt)) : currentSel === opt}
                  onSelect={() => handleSelect(opt)}
                />
              ))
            ) : stepData.type === "text" ? (
              <textarea
                rows={4}
                placeholder={stepData.placeholder || "Type here…"}
                value={currentSel || ""}
                onChange={e => setSelections(prev => ({ ...prev, [currentStep]: e.target.value }))}
                style={{ width:"100%", border:`1.5px solid rgba(26,188,156,0.25)`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", boxSizing:"border-box" }}
              />
            ) : null}
          </>
        ) : (
          <div style={{ textAlign:"center", padding:"20px 0", color:G.mutedText, fontSize:14 }}>Ready to send to your Concierge.</div>
        )}
      </div>

      <div style={{ padding:"16px 24px 20px", borderTop:`1px solid rgba(26,188,156,0.10)`, display:"flex", gap:10, flexShrink:0 }}>
        {currentStep > 1 && (
          <button onClick={() => setCurrentStep(s => s-1)} style={{ flex:1, background:"#fff", border:`1.5px solid rgba(26,188,156,0.20)`, borderRadius:12, padding:"12px", fontSize:13, fontWeight:600, color:G.mutedText, cursor:"pointer" }}>← Back</button>
        )}
        {currentStep < totalSteps ? (
          <button
            onClick={() => hasAnswer || !stepData ? setCurrentStep(s=>s+1) : null}
            disabled={stepData && !hasAnswer}
            style={{ flex:2, background:stepData&&!hasAnswer?"#E8E0D8":`linear-gradient(135deg,${G.teal},${G.deepMid})`, color:stepData&&!hasAnswer?"#999":"#fff", border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:800, cursor:stepData&&!hasAnswer?"not-allowed":"pointer" }}>
            Continue →
          </button>
        ) : (
          <button onClick={handleSend} disabled={sending}
            style={{ flex:2, background:sending?"#E8E0D8":`linear-gradient(135deg,${path.accentColor},${path.accentColor}BB)`, color:sending?"#999":"#fff", border:"none", borderRadius:12, padding:"12px", fontSize:14, fontWeight:800, cursor:sending?"wait":"pointer" }}>
            {sending?"Sending…":"Hand to Concierge® →"}
          </button>
        )}
      </div>
    </ModalShell>
  );
}

// ── MAIN EXPORT ──────────────────────────────────────────────
export default function GuidedGoPaths({ pet }) {
  const [openPath,   setOpenPath]   = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [showAll,    setShowAll]    = useState(true);

  const allPaths = buildPaths(pet);
  const paths    = showAll ? allPaths : allPaths.slice(0, 3);

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
        <div style={{ fontSize:20, fontWeight:800, color:"#0D3349", fontFamily:"Georgia,serif" }}>Guided Go Paths</div>
        <button onClick={() => setShowAll(!showAll)} style={{ background:"none", border:"1.5px solid #76D7C4", borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:600, color:"#1A5276", cursor:"pointer" }}>
          {showAll ? "Show less" : `See all ${allPaths.length}`}
        </button>
      </div>
      <div style={{ fontSize:12, color:"#5D6D7E", marginBottom:18 }}>
        Mira picked {allPaths.length} travel paths for {pet?.name || "your dog"}
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
                    <span style={{ fontSize:14, fontWeight:700, color:"#0D3349" }}>{path.title}</span>
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
                  {path.stepLabels.map((label, i) => (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:26, height:26, borderRadius:"50%", border:`1.5px solid ${path.accentColor}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:path.accentColor, flexShrink:0 }}>{i+1}</div>
                      <span style={{ fontSize:13, color:"#0D3349" }}>{label}</span>
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
