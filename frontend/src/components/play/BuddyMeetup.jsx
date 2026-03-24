/**
 * BuddyMeetup.jsx — /play pillar
 * Social playdate coordination: find a matched play partner for your dog.
 * Mira matches by energy, size, social comfort & breed compatibility.
 * All actions fire concierge tickets via useConcierge.
 */
import { useState } from "react";
import { useConcierge } from "../../hooks/useConcierge";

const G = {
  deep:"#7B2D00", mid:"#7B3F00", orange:"#E76F51",
  light:"#FFAD9B", pale:"#FFF0EA", cream:"#FFF8F5",
  darkText:"#7B2D00", mutedText:"#8B4513",
  green:"#16A34A", greenBg:"#F0FDF4", greenBorder:"#BBF7D0",
};

const SOCIAL_TYPES = [
  { id:"one_on_one",  icon:"🐾", label:"One-on-one playdate",   desc:"Mira matches your dog with one compatible companion" },
  { id:"small_group", icon:"🐕", label:"Small group (3–5 dogs)", desc:"A curated group matched by size and energy" },
  { id:"breed_meet",  icon:"🏷",  label:"Breed meetup",           desc:"Meet other dogs of the same breed in your city" },
  { id:"park_social",icon:"🌳", label:"Park social",            desc:"Organised off-lead session at a safe enclosed park" },
  { id:"puppy_play", icon:"🐶", label:"Puppy playdate",         desc:"Age-matched session for puppies under 12 months" },
  { id:"senior_walk",icon:"🌸", label:"Senior gentle walk",     desc:"Low-energy social walk for senior dogs" },
];

const COMFORT_LEVELS = [
  { id:"confident", label:"Confident & social",   color:"#16A34A" },
  { id:"selective", label:"Selective — certain dogs only", color:"#E76F51" },
  { id:"nervous",   label:"Nervous or shy",        color:"#F59E0B" },
  { id:"reactive",  label:"Reactive — needs careful intro", color:"#EF4444" },
  { id:"unknown",   label:"Not sure yet",          color:"#8B4513" },
];

export default function BuddyMeetup({ pet }) {
  const petName = pet?.name || "your dog";
  const energy = pet?.doggy_soul_answers?.energy_level || null;
  const size = pet?.doggy_soul_answers?.size || pet?.size || null;
  const breed = pet?.breed || null;
  const isSenior = parseInt(pet?.doggy_soul_answers?.age_years || "0") >= 7;

  const [step, setStep] = useState(0); // 0=overview, 1=type, 2=comfort, 3=prefs, 4=sent
  const [selectedType, setSelectedType] = useState(null);
  const [comfort, setComfort] = useState(null);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);

  const { book } = useConcierge({ pet, pillar: "play" });

  const handleSubmit = async () => {
    if (sending) return;
    setSending(true);
    const typeLabel = SOCIAL_TYPES.find(t => t.id === selectedType)?.label || selectedType;
    const comfortLabel = COMFORT_LEVELS.find(c => c.id === comfort)?.label || comfort;
    await book({
      service: `${petName}'s Buddy Meetup — ${typeLabel}`,
      channel: "play_buddy_meetup",
      urgency: "normal",
      notes: [
        `Type: ${typeLabel}`,
        `Social comfort: ${comfortLabel}`,
        energy ? `Energy level: ${energy}` : null,
        size ? `Size: ${size}` : null,
        breed ? `Breed: ${breed}` : null,
        location ? `Preferred location: ${location}` : null,
        notes ? `Parent notes: ${notes}` : null,
      ].filter(Boolean).join(" | "),
    });
    setStep(4);
    setSending(false);
  };

  // Overview card — entry point
  if (step === 0) {
    return (
      <div data-testid="buddy-meetup-section" style={{ marginBottom:32 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#9B59B6,#E91E8C)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#fff" }}>
            ✦
          </div>
          <span style={{ fontSize:14, fontWeight:700, color:G.deep }}>Buddy Meetup</span>
          <span style={{ fontSize:13, color:G.mutedText }}>by Mira</span>
        </div>

        <div
          onClick={() => setStep(1)}
          style={{
            background:"linear-gradient(135deg, #FFF0EA, #FFF8F5)",
            border:`2px solid ${G.orange}30`,
            borderRadius:18, padding:"22px 20px", cursor:"pointer",
            transition:"all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor=G.orange; e.currentTarget.style.transform="translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=`${G.orange}30`; e.currentTarget.style.transform="none"; }}
        >
          <div style={{ fontSize:32, marginBottom:10 }}>🐾</div>
          <div style={{ fontSize:16, fontWeight:800, color:G.deep, marginBottom:6, fontFamily:"Georgia,serif" }}>
            Find {petName} a play buddy
          </div>
          <div style={{ fontSize:13, color:G.mutedText, lineHeight:1.6, marginBottom:14 }}>
            Mira matches {petName} with a compatible companion by energy, size, and temperament.
            {energy && <span style={{ display:"block", marginTop:4, color:G.orange, fontWeight:600 }}>
              {petName}'s energy: {energy} {isSenior ? "· Senior dog" : ""}
            </span>}
          </div>

          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
            {energy && <span style={{ fontSize:13, fontWeight:600, color:G.orange, background:`${G.orange}12`, border:`1px solid ${G.orange}25`, borderRadius:20, padding:"3px 10px" }}>
              {energy} energy
            </span>}
            {size && <span style={{ fontSize:13, fontWeight:600, color:G.mid, background:`${G.mid}10`, border:`1px solid ${G.mid}20`, borderRadius:20, padding:"3px 10px" }}>
              {size}
            </span>}
            {breed && <span style={{ fontSize:13, fontWeight:600, color:G.deep, background:`${G.deep}10`, border:`1px solid ${G.deep}20`, borderRadius:20, padding:"3px 10px" }}>
              {breed}
            </span>}
          </div>

          <button style={{
            width:"100%", padding:"12px", borderRadius:12, border:"none",
            background:`linear-gradient(135deg,${G.orange},${G.mid})`,
            color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8
          }}>
            Find a buddy for {petName}
          </button>
        </div>
      </div>
    );
  }

  // Sent confirmation
  if (step === 4) {
    return (
      <div data-testid="buddy-meetup-sent" style={{
        background:G.greenBg, border:`2px solid ${G.greenBorder}`, borderRadius:18,
        padding:"32px 24px", textAlign:"center", marginBottom:32
      }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🐾</div>
        <div style={{ fontSize:18, fontWeight:800, color:G.green, marginBottom:8, fontFamily:"Georgia,serif" }}>
          Buddy search started!
        </div>
        <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.6, marginBottom:20 }}>
          Mira is finding the perfect match for {petName}. Your Concierge will reach out with options within 48 hours.
        </div>
        <button onClick={() => setStep(0)} style={{
          background:"#fff", border:`1.5px solid ${G.greenBorder}`, borderRadius:12,
          padding:"10px 24px", fontSize:13, fontWeight:600, color:G.green, cursor:"pointer"
        }}>
          Done
        </button>
      </div>
    );
  }

  // Step flow modal
  return (
    <div data-testid="buddy-meetup-flow" style={{ marginBottom:32 }}>
      {/* Step header */}
      <div style={{ background:`linear-gradient(135deg,${G.orange},${G.mid})`, borderRadius:"18px 18px 0 0", padding:"18px 20px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:15, fontWeight:800, color:"#fff" }}>
            {step === 1 ? "What kind of meetup?" : step === 2 ? `${petName}'s social comfort` : "Final details"}
          </span>
          <button onClick={() => setStep(0)} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:"50%", width:28, height:28, cursor:"pointer", color:"#fff", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>
            ✕
          </button>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ flex:1, height:3, borderRadius:3, background: i <= step ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }} />
          ))}
        </div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginTop:6 }}>Step {step} of 3</div>
      </div>

      <div style={{ background:"#fff", border:`1px solid ${G.orange}20`, borderRadius:"0 0 18px 18px", padding:"20px" }}>
        {/* Step 1: Social type */}
        {step === 1 && (
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:14 }}>
              Choose a meetup type for {petName}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {SOCIAL_TYPES.map(t => {
                const sel = selectedType === t.id;
                return (
                  <button key={t.id} onClick={() => setSelectedType(t.id)}
                    data-testid={`buddy-type-${t.id}`}
                    style={{
                      display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                      borderRadius:12, border:`1.5px solid ${sel ? G.orange : "#E8E0D8"}`,
                      background: sel ? G.pale : "#fff", cursor:"pointer", textAlign:"left",
                      transition:"all 0.12s"
                    }}>
                    <span style={{ fontSize:22, flexShrink:0 }}>{t.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color: sel ? G.deep : G.darkText }}>{t.label}</div>
                      <div style={{ fontSize:13, color:G.mutedText, marginTop:2 }}>{t.desc}</div>
                    </div>
                    {sel && <div style={{ width:18, height:18, borderRadius:"50%", background:G.orange, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:10, flexShrink:0 }}>✓</div>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Comfort level */}
        {step === 2 && (
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:6 }}>
              How is {petName} around other dogs?
            </div>
            <div style={{ fontSize:13, color:G.mutedText, marginBottom:14 }}>
              This helps Mira find the right match — no pressure, no rushing.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {COMFORT_LEVELS.map(c => {
                const sel = comfort === c.id;
                return (
                  <button key={c.id} onClick={() => setComfort(c.id)}
                    data-testid={`buddy-comfort-${c.id}`}
                    style={{
                      display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                      borderRadius:12, border:`1.5px solid ${sel ? c.color : "#E8E0D8"}`,
                      background: sel ? `${c.color}08` : "#fff", cursor:"pointer", textAlign:"left"
                    }}>
                    <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${sel ? c.color : "#CCC"}`, background: sel ? c.color : "#fff", flexShrink:0 }} />
                    <span style={{ fontSize:13, fontWeight: sel ? 700 : 400, color: sel ? c.color : G.darkText }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Location + notes */}
        {step === 3 && (
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:14 }}>
              Almost there — where and any notes?
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:600, color:G.darkText, display:"block", marginBottom:6 }}>
                Preferred area / city
              </label>
              <input
                type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Indiranagar, Bangalore"
                data-testid="buddy-location-input"
                style={{
                  width:"100%", border:"1.5px solid #E8E0D8", borderRadius:10,
                  padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none",
                  boxSizing:"border-box"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:G.darkText, display:"block", marginBottom:6 }}>
                Anything else about {petName}? <span style={{ color:"#BBB", fontWeight:400 }}>Optional</span>
              </label>
              <textarea
                rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder={`${petName}'s triggers, favourite games, health notes...`}
                data-testid="buddy-notes-input"
                style={{
                  width:"100%", border:"1.5px solid #E8E0D8", borderRadius:10,
                  padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none",
                  resize:"none", fontFamily:"inherit", lineHeight:1.6, boxSizing:"border-box"
                }}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid #E0E0E0", background:"#fff", fontSize:13, fontWeight:600, color:G.mutedText, cursor:"pointer" }}>
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => { if ((step===1 && selectedType) || (step===2 && comfort)) setStep(s => s+1); }}
              disabled={(step===1 && !selectedType) || (step===2 && !comfort)}
              data-testid="buddy-next-btn"
              style={{
                flex:2, padding:"12px", borderRadius:12, border:"none",
                background: (step===1 && selectedType) || (step===2 && comfort) ? G.orange : "#E8E0D8",
                fontSize:13, fontWeight:700,
                color: (step===1 && selectedType) || (step===2 && comfort) ? "#fff" : "#999",
                cursor: (step===1 && selectedType) || (step===2 && comfort) ? "pointer" : "not-allowed"
              }}>
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={sending}
              data-testid="buddy-submit-btn"
              style={{
                flex:2, padding:"12px", borderRadius:12, border:"none",
                background:`linear-gradient(135deg,${G.orange},${G.mid})`,
                fontSize:14, fontWeight:700, color:"#fff",
                cursor: sending ? "not-allowed" : "pointer",
                opacity: sending ? 0.7 : 1
              }}>
              {sending ? "Finding a buddy..." : `Find ${petName} a buddy`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
