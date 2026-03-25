/**
 * GuidedPlayPaths.jsx — /play pillar guided paths
 * Mirrors GuidedGoPaths.jsx — card grid with step chips, badge, modal flow
 *
 * 6 Paths:
 *   1. Park Routine            — Daily outdoor habit
 *   2. Playdate Starter        — First playdate: nervous → social
 *   3. Swim Confidence         — Water-shy → water dog in 4 sessions
 *   4. Agility Fast-Track      — Zero to course in 30 days
 *   5. Fitness Reboot          — Post-illness recovery
 *   6. Soul Play Journey       — Play as bonding and identity
 */

import { useState } from "react";
import { API_URL } from "../../utils/api";
import { tdc } from "../../utils/tdc_intent";
import { useConcierge } from "../../hooks/useConcierge";

const G = {
  deep:     "#7B2D00", mid:      "#7B3F00", orange:   "#E76F51",
  light:    "#FFAD9B", pale:     "#FFF0EA", cream:    "#FFF8F5",
  darkText: "#7B2D00", mutedText:"#8B4513",
};
const MIRA_ORB = "linear-gradient(135deg,#9B59B6,#E91E8C,#FF6EC7)";

// ─── PATH DATA ──────────────────────────────────────────────────────────────
export function buildPaths(pet) {
  const petName  = pet?.name || "your dog";
  const energy   = (pet?.doggy_soul_answers?.energy_level || "").toLowerCase();
  const isHigh   = energy === "high" || energy === "very high";
  const isSenior = parseInt(pet?.doggy_soul_answers?.age_years||"0") >= 7;

  return [
    {
      id:"park_routine",
      icon:"🌳",
      title:"The Park Routine",
      badge:"Mira Pick",   badgeBg:"#E76F51",
      accentColor:"#7B2D00", accentBg:"#FFF0EA", accentBorder:"rgba(231,111,81,0.15)",
      iconBg:"#FFCCBC", photoBg:"linear-gradient(135deg,#FFF0EA,#FFCCBC)",
      desc:`Build a daily park habit that keeps ${petName} happy, healthy, and thoroughly tired out.`,
      miraNote:`I'll pick the safest enclosed parks near you and set ${petName}'s routine to match their energy level.`,
      stepLabels:["Choose your park","Pack the essentials","Set the routine","Track with Mira"],
      steps:{
        step1:{q:"What kind of outdoor space does "+petName+" prefer?",type:"single",opts:["Enclosed dog park","Open field","Trail / woodland","Beach / riverside","Not sure — Mira will suggest"]},
        step2:{q:"Which essentials do you already have?",type:"multi",opts:["Collapsible bowl","Treat pouch","Poop bag holder","Long line / flexi lead","GPS tracker","Cooling mat","None yet — Mira will recommend"]},
        step3:{q:"How often can you take "+petName+" out?",type:"single",opts:["Daily","4–5 times per week","2–3 times per week","Weekends only"]},
        step4:{q:"What time of day works best?",type:"single",opts:["Early morning","Late morning","Afternoon","Evening","Mixed / flexible"]},
      },
    },
    {
      id:"playdate_starter",
      icon:"🐾",
      title:"Playdate Starter",
      badge: isHigh ? "Priority" : "Mira Pick", badgeBg: isHigh ? "#C62828" : "#E76F51",
      accentColor:"#7B3F00", accentBg:"#FFF0EA", accentBorder:"rgba(123,63,0,0.15)",
      iconBg:"#FFE0B2", photoBg:"linear-gradient(135deg,#FFF3E0,#FFE0B2)",
      desc:`${petName}'s first playdate — from nervous to social in four carefully managed steps.`,
      miraNote:`I'll match ${petName} with a compatible dog by size, energy, and temperament before the first meeting.`,
      stepLabels:["Play profile & matching","Neutral ground intro","First off-lead session","Book the next one"],
      steps:{
        step1:{q:"How does "+petName+" behave with other dogs?",type:"single",opts:["Very friendly — loves all dogs","Selective — prefers certain dogs","Nervous / shy","Reactive — needs careful intro","Not sure yet"]},
        step2:{q:"What size match would work best?",type:"single",opts:["Same size","Smaller dog","Larger dog","Either — Mira will decide","Not sure"]},
        step3:{q:"Where should the first meeting happen?",type:"single",opts:["Neutral park near me","Dog park","My compound / building","Mira's recommended venue"]},
        step4:{q:"How often would you like playdates?",type:"single",opts:["Weekly","Fortnightly","Monthly","Whenever Mira finds a match"]},
      },
    },
    {
      id:"swim_confidence",
      icon:"🏊",
      title:"Swim Confidence",
      badge:"Mira Pick", badgeBg:"#1565C0",
      accentColor:"#1565C0", accentBg:"#E3F2FD", accentBorder:"rgba(21,101,192,0.15)",
      iconBg:"#BBDEFB", photoBg:"linear-gradient(135deg,#E3F2FD,#90CAF9)",
      desc:`From splash-shy to water dog in four guided sessions with a trained swim companion.`,
      miraNote:`I'll assess ${petName}'s comfort level first — no pressure, no rushing. We build confidence step by step.`,
      stepLabels:["Water intro (shallow)","First guided swim","Distance building","Pool independence"],
      steps:{
        step1:{q:"Has "+petName+" been in water before?",type:"single",opts:["Never","Wading only (paddling pool)","Brief swims with support","Comfortable but untrained","Scared of water"]},
        step2:{q:"What's the goal?",type:"single",opts:["Confidence & fun","Fitness & conditioning","Cooling down in summer","Competition / water sports","All of the above"]},
        step3:{q:"Any health conditions to be aware of?",type:"multi",opts:["Joint issues / arthritis","Ear sensitivity","Skin condition","Heart condition","None","Mira will check with vet"]},
        step4:{q:"How many sessions per month?",type:"single",opts:["1 session","2 sessions","Weekly","Intensive (2–3 per week)"]},
      },
    },
    {
      id:"agility_fast_track",
      icon:"⚡",
      title:"Agility Fast-Track",
      badge: isHigh ? "Priority" : "Explore", badgeBg: isHigh ? "#C62828" : "#FF6F00",
      accentColor:"#E65100", accentBg:"#FFF3E0", accentBorder:"rgba(230,81,0,0.15)",
      iconBg:"#FFE0B2", photoBg:"linear-gradient(135deg,#FFF8E1,#FFCC80)",
      desc:`From zero to first course in 30 days — Mira designs the training plan, you bring the treats.`,
      miraNote: isHigh ? `${petName}'s high energy is perfect for agility — it's the best way to tire out a fast brain.` : `Agility works for all energy levels — it's as much about brain work as physical speed.`,
      stepLabels:["Agility assessment","Tunnel & jump intro","Course practice","First demo run"],
      steps:{
        step1:{q:"Has "+petName+" done any training?",type:"single",opts:["Basic obedience only","Some agility intro","Intermediate — knows commands","Advanced — ready for course","None yet"]},
        step2:{q:"What motivates "+petName+" most?",type:"single",opts:["Food treats","Toy / tug reward","Praise & affection","Play as reward","Mixed motivation"]},
        step3:{q:"How many sessions per week?",type:"single",opts:["1 session (casual)","2 sessions (steady)","3 sessions (committed)","Daily (fast-track)"]},
        step4:{q:"Any health or physical limitations?",type:"multi",opts:["Hip dysplasia","Joint issues","Cardiac condition","None","Mira will check"]},
      },
    },
    {
      id:"fitness_reboot",
      icon:"💪",
      title:"Fitness Reboot",
      badge: isSenior ? "Senior Care" : "Mira Pick", badgeBg: isSenior ? "#6A1B9A" : "#2E7D32",
      accentColor:"#2E7D32", accentBg:"#E8F5E9", accentBorder:"rgba(46,125,50,0.15)",
      iconBg:"#C8E6C9", photoBg:"linear-gradient(135deg,#E8F5E9,#A5D6A7)",
      desc:`Post-illness or low-activity recovery — a certified canine fitness plan built around ${petName}'s current ability.`,
      miraNote: isSenior ? `At ${petName}'s age, recovery is gradual — I'll keep sessions short, safe, and genuinely enjoyable.` : `I'll track ${petName}'s progress and flag if we're moving too fast or not fast enough.`,
      stepLabels:["Fitness baseline","Gentle movement plan","Progressive loading","Back to full active life"],
      steps:{
        step1:{q:"Why the fitness reboot?",type:"single",opts:["Post illness / surgery","Low activity period","New to exercise","Weight management","Senior dog","Just getting started"]},
        step2:{q:"What activities can "+petName+" currently do?",type:"multi",opts:["Short walks (under 20 min)","Normal walks (30–45 min)","Light play at home","Swimming (low impact)","Nothing yet — very low activity"]},
        step3:{q:"Any current health conditions?",type:"multi",opts:["Arthritis / joint pain","Post-surgery","Heart condition","Obesity","None","Mira will advise"]},
        step4:{q:"What's the 6-week goal?",type:"single",opts:["Normal daily walks","Park outings","Swimming / agility","Full active lifestyle","Follow Mira's recommendation"]},
      },
    },
    {
      id:"walk_essentials",
      icon:"🦮",
      title:"Walk Essentials",
      badge:"Mira Guided", badgeBg:"#0D9488",
      accentColor:"#0D9488", accentBg:"#F0FDFA", accentBorder:"rgba(13,148,136,0.15)",
      iconBg:"#99F6E4", photoBg:"linear-gradient(135deg,#F0FDFA,#5EEAD4)",
      desc:`Build ${petName}'s perfect walk routine — gear, frequency, and distance matched to ${pet?.breed || 'their breed'}.`,
      miraNote:`I know ${petName}'s energy and pace. Let me build the ideal walk setup.`,
      stepLabels:["Walk frequency","Gear check","Route preference","Special needs"],
      steps:{
        step1:{q:`How often does ${petName} walk?`,type:"single",opts:["Twice daily","Once daily","3–4 times a week","Weekends only","Irregular — need a routine"]},
        step2:{q:"Which walk gear does "+petName+" need?",type:"multi",opts:["Harness","Collar & leash","Reflective vest","Poop bag holder","Portable water bowl","Treat pouch","Rain jacket","All of the above"]},
        step3:{q:`What kind of walks does ${petName} prefer?`,type:"single",opts:["Neighbourhood streets","Park trails","Off-lead fields","Beach / waterside","Urban — cafés & shops","Long hikes"]},
        step4:{q:"Any special walk needs?",type:"multi",opts:["Pulls hard — need no-pull harness","Reactive to other dogs","Gets anxious on walks","Senior — needs shorter routes","Puppy — needs socialisation walks","Night walks — need lights","No special needs"]},
      },
    },
    {
      id:"soul_play_journey",
      icon:"✨",
      title:"Soul Play Journey",
      badge:"Mira Pick", badgeBg:"#9B59B6",
      accentColor:"#9B59B6", accentBg:"#F3E5F5", accentBorder:"rgba(155,89,182,0.15)",
      iconBg:"#E1BEE7", photoBg:"linear-gradient(135deg,#F3E5F5,#CE93D8)",
      desc:`Play as bonding, expression, and identity — ${petName}'s play personality captured and celebrated.`,
      miraNote:`${petName} has a play identity. Let me help you discover it, express it, and share it with the world.`,
      stepLabels:["Discover play style","Personalise the kit","Capture the moment","Build the community"],
      steps:{
        step1:{q:"How would you describe "+petName+"'s play personality?",type:"multi",opts:["Fetch obsessed","Social butterfly","Lone explorer","Tug-of-war champion","Sniff detective","Zoomies specialist","Gentle & calm"]},
        step2:{q:"Which soul products interest you?",type:"multi",opts:["Play identity bandana","Playdate calling cards","Custom photo frame","Breed art print","Mira memory journal","All of the above"]},
        step3:{q:"Would you like a Soul Play Photo Session?",type:"single",opts:["Yes — at a park","Yes — at home","Yes — professional studio","Maybe later","Not right now"]},
        step4:{q:"Connect with other Mira dogs?",type:"single",opts:["Yes — group outings","Yes — neighbourhood meet","Yes — Mira matchmaking","Prefer one-on-one playdates","Not right now"]},
      },
    },
  ];
}

// ─── MODAL SHELL — defined OUTSIDE render to prevent remount issues ──────────
function ModalShell({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, zIndex:700, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width:"min(560px,100%)", maxHeight:"90vh", background:"#fff", borderRadius:20, overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 80px rgba(0,0,0,0.35)" }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── PATH FLOW MODAL ─────────────────────────────────────────────────────────
export function PathFlowModal({ path, pet, onClose }) {
  const petName      = pet?.name || "your dog";
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const { fire } = useConcierge({ pet, pillar: 'play' });
  const totalSteps   = Object.keys(path.steps).length;
  const stepKey      = `step${step}`;
  const stepData     = path.steps[stepKey];
  const currentAns   = answers[stepKey] || [];
  const hasAnswer    = currentAns.length > 0;

  const toggle = (opt) => {
    if (!stepData) return;
    if (stepData.type === "single") {
      setAnswers(prev => ({ ...prev, [stepKey]: [opt] }));
    } else {
      setAnswers(prev => {
        const cur = prev[stepKey] || [];
        return { ...prev, [stepKey]: cur.includes(opt) ? cur.filter(o=>o!==opt) : [...cur, opt] };
      });
    }
  };

  const handleSubmit = async () => {
    if (sending) return;
    setSending(true);
    tdc.request({ text: `Completed guided path: ${path.title}`, name: path.title, pillar: "play", pet, channel: "play_guided_paths_complete" });
    await fire({
      service: `${pet?.name || 'Dog'}'s ${path.title} — Guided Play Path`,
      channel: 'play_guided_paths_complete',
      urgency: 'normal',
      notes: JSON.stringify(answers),
    });
    setSent(true);
    setSending(false);
  };

  return (
    <ModalShell onClose={onClose}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${path.accentColor},${path.badgeBg})`, padding:"20px 24px 16px", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:24 }}>{path.icon}</span>
            <span style={{ fontSize:15, fontWeight:800, color:"#fff" }}>{path.title}</span>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.20)", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", color:"#fff", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        {/* Step progress dots */}
        <div style={{ display:"flex", gap:6 }}>
          {Array.from({length:totalSteps}).map((_,i) => (
            <div key={i} style={{ flex:1, height:3, borderRadius:3, background: i<step ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.30)" }} />
          ))}
        </div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.70)", marginTop:6 }}>Step {step} of {totalSteps}</div>
      </div>

      {sent ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:32, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:16 }}>✓</div>
          <div style={{ fontSize:18, fontWeight:800, color:G.darkText, marginBottom:8 }}>Mira is on it</div>
          <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.6, maxWidth:340 }}>
            Your plan for {petName}'s {path.title.toLowerCase()} is being built. Check your messages.
          </div>
          <button onClick={onClose} style={{ marginTop:24, padding:"10px 28px", borderRadius:12, background:path.badgeBg, border:"none", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>Done</button>
        </div>
      ) : (
        <>
          {/* Scrollable content */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
            {/* Mira note */}
            <div style={{ display:"flex", gap:8, background:path.accentBg, border:`1px solid ${path.accentBorder}`, borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", flexShrink:0, marginTop:1 }}>✦</div>
              <p style={{ fontSize:13, color:path.accentColor, fontStyle:"italic", margin:0, lineHeight:1.5 }}>"{path.miraNote}"</p>
            </div>

            {stepData && (
              <>
                <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:14 }}>{stepData.q}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {stepData.opts.map(opt => {
                    const sel = currentAns.includes(opt);
                    return (
                      <button key={opt} onClick={() => toggle(opt)}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${sel ? path.badgeBg : "#E5E5E5"}`, background:sel ? path.accentBg : "#fff", cursor:"pointer", textAlign:"left", transition:"all 0.12s" }}>
                        <div style={{ width:16, height:16, borderRadius: stepData.type==="single" ? "50%" : 4, border:`2px solid ${sel?path.badgeBg:"#CCC"}`, background:sel?path.badgeBg:"#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {sel && <div style={{ width:6, height:6, borderRadius: stepData.type==="single" ? "50%" : 2, background:"#fff" }} />}
                        </div>
                        <span style={{ fontSize:13, color:sel?path.accentColor:G.darkText, fontWeight:sel?600:400 }}>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer with Continue / Back */}
          <div style={{ padding:"14px 24px 20px", borderTop:"1px solid #F0F0F0", display:"flex", gap:10, flexShrink:0 }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s-1)}
                style={{ flex:1, padding:"11px 0", borderRadius:12, border:"1.5px solid #E0E0E0", background:"#fff", fontSize:13, fontWeight:600, color:G.mutedText, cursor:"pointer" }}>
                ← Back
              </button>
            )}
            {step < totalSteps ? (
              <button
                onClick={() => hasAnswer ? setStep(s => s+1) : null}
                disabled={!hasAnswer}
                data-testid="play-path-continue"
                style={{ flex:2, padding:"11px 0", borderRadius:12, border:"none", background: hasAnswer ? path.badgeBg : "#E8E0D8", fontSize:13, fontWeight:700, color: hasAnswer ? "#fff" : "#999", cursor: hasAnswer ? "pointer" : "not-allowed", transition:"all 0.15s" }}>
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={sending}
                data-testid="play-path-submit"
                style={{ flex:2, padding:"11px 0", borderRadius:12, border:"none", background:path.badgeBg, fontSize:13, fontWeight:700, color:"#fff", cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.7 : 1 }}>
                {sending ? "Sending…" : "Hand to Concierge® →"}
              </button>
            )}
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function GuidedPlayPaths({ pet }) {
  const petName = pet?.name || "your dog";
  const paths   = buildPaths(pet);
  const [activePath, setActivePath] = useState(null);

  return (
    <div style={{ marginTop:8, marginBottom:40 }} data-testid="guided-play-paths">
      {activePath && (
        <PathFlowModal path={activePath} pet={pet} onClose={() => setActivePath(null)} />
      )}

      {/* Section header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(231,111,81,0.12)", borderRadius:20, padding:"4px 12px", marginBottom:10 }}>
          <div style={{ width:18, height:18, borderRadius:"50%", background:MIRA_ORB, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff" }}>✦</div>
          <span style={{ fontSize:13, color:G.mid, fontWeight:700 }}>Guided by Mira</span>
        </div>
        <h2 style={{ fontSize:"clamp(1.25rem,3vw,1.625rem)", fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:6, lineHeight:1.2 }}>
          Guided Play Paths for <span style={{ color:G.orange }}>{petName}</span>
        </h2>
        <p style={{ fontSize:13, color:G.mutedText, lineHeight:1.6 }}>
          Step-by-step play plans built around {petName}'s energy, personality, and health. Mira takes care of the rest.
        </p>
      </div>

      {/* Cards grid */}
      <div style={{ display:"grid", gap:16 }} className="play-paths-grid">
        <style>{`
          .play-paths-grid { grid-template-columns: 1fr; }
          @media(min-width:560px){ .play-paths-grid{ grid-template-columns: repeat(2,1fr); } }
          @media(min-width:860px){ .play-paths-grid{ grid-template-columns: repeat(3,1fr); } }
        `}</style>
        {paths.map(path => (
          <div key={path.id}
            onClick={() => setActivePath(path)}
            data-testid={`play-path-card-${path.id}`}
            style={{ borderRadius:18, overflow:"hidden", cursor:"pointer", border:`1px solid ${path.accentBorder}`, background:"#fff", transition:"transform 0.18s, box-shadow 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=`0 8px 28px ${path.accentBorder}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
          >
            {/* Card hero */}
            <div style={{ background:path.photoBg, padding:"22px 20px 16px", position:"relative" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ width:48, height:48, borderRadius:14, background:path.iconBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
                  {path.icon}
                </div>
                <div style={{ display:"inline-flex", alignItems:"center", gap:4, background:path.badgeBg, borderRadius:20, padding:"3px 10px" }}>
                  <span style={{ fontSize:9, fontWeight:800, color:"#fff" }}>★ {path.badge}</span>
                </div>
              </div>
              <div style={{ fontSize:15, fontWeight:800, color:path.accentColor, marginBottom:4 }}>{path.title}</div>
              <p style={{ fontSize:13, color:G.mutedText, lineHeight:1.5, margin:0 }}>{path.desc}</p>
            </div>

            {/* Step chips */}
            <div style={{ padding:"12px 16px 16px", background:"#fff" }}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                {path.stepLabels.map((label, i) => (
                  <span key={i} style={{ fontSize:10, fontWeight:600, color:path.accentColor, background:path.accentBg, border:`1px solid ${path.accentBorder}`, borderRadius:20, padding:"3px 9px" }}>
                    {i+1}. {label}
                  </span>
                ))}
              </div>
              <button
                style={{ width:"100%", padding:"9px 0", borderRadius:12, border:"none", background:path.badgeBg, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}
                onClick={e => { e.stopPropagation(); tdc.request({ text: `Started guided path: ${path.title}`, name: path.title, pillar: "play", pet, channel: "play_guided_paths_start" }); setActivePath(path); }}
              >
                Start path → <span style={{ fontSize:10, background:"rgba(255,255,255,0.25)", borderRadius:20, padding:"2px 7px" }}>★ Mira</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
