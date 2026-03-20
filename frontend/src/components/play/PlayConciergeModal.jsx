/**
 * PlayConciergeModal.jsx — /play pillar concierge intake
 * Mirrors GoConciergeModal.jsx — green/orange colour world
 * POST /api/concierge/play-intake
 * Props: pet, service, token, onClose
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { bookViaConcierge } from "../../utils/MiraCardActions";
import { useAuth } from "../../context/AuthContext";

const G = { deep:"#7B2D00", mid:"#7B3F00", green:"#E76F51", light:"#FFAD9B", pale:"#FFF0EA", cream:"#FFF8F5", darkText:"#7B2D00", mutedText:"#8B4513" };

const PLAY_OCCASIONS = [
  "Find a dog park nearby",
  "Coordinate a playdate",
  "Book dog walking",
  "Plan a weekend adventure",
  "Fitness assessment & programme",
  "Swimming or hydrotherapy",
  "Agility training",
  "Pet event or experience",
  "Socialisation planning",
  "Beach day planning",
  "Just exploring options",
];

export default function PlayConciergeModal({ pet, service, token, onClose }) {
  const [occasion,    setOccasion]    = useState(service?.name || null);
  const [date,        setDate]        = useState("");
  const [notSureDate, setNotSureDate] = useState(false);
  const [notes,       setNotes]       = useState("");
  const [sent,        setSent]        = useState(false);
  const [sending,     setSending]     = useState(false);
  const { token: authToken } = useAuth();
  const petName = pet?.name || "your dog";
  const canSend = occasion !== null;

  const handleSend = async () => {
    if (sending) return;
    setSending(true);
    await bookViaConcierge({
      service: occasion,
      pillar: "play",
      pet,
      token: token || authToken,
      channel: "play_concierge_modal",
      notes,
      date: notSureDate ? null : date,
      onSuccess: () => setSent(true),
    });
    setSending(false);
  };

  const modal = (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:10010, background:"rgba(0,0,0,0.60)", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:24, width:"min(640px,100%)", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 24px 80px rgba(0,0,0,0.35)" }}>
        {sent ? (
          <div style={{ padding:"48px 36px", textAlign:"center" }}>
            <div style={{ width:72, height:72, borderRadius:"50%", background:`linear-gradient(135deg,${G.orange},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px" }}>🌳</div>
            <div style={{ fontSize:22, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:8 }}>Sent to {petName}'s Play Concierge.</div>
            <div style={{ fontSize:14, color:G.mutedText, lineHeight:1.7, marginBottom:28 }}>Everything is in good hands.<br/>Your Concierge will reach out within 48 hours. ♥</div>
            <button onClick={onClose} style={{ background:"#F5F5F5", border:"none", borderRadius:20, padding:"10px 28px", fontSize:13, fontWeight:600, color:"#555", cursor:"pointer" }}>Close</button>
          </div>
        ) : (
          <div style={{ padding:"32px 32px 28px" }}>
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:4 }}>
              <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, color:"#BBB", cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:G.pale, border:`1px solid rgba(231,111,81,0.30)`, borderRadius:20, padding:"4px 12px", color:G.mid, fontSize:12, fontWeight:600, marginBottom:16 }}>
              🌳 {petName}'s Play Concierge
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", lineHeight:1.2, marginBottom:6 }}>
              What does <span style={{ color:G.orange }}>{petName}</span> want to do?
            </div>
            <div style={{ fontSize:14, color:G.mutedText, marginBottom:26 }}>Three questions. Then your Concierge takes over.</div>

            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>What are we planning?</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:24 }}>
              {PLAY_OCCASIONS.map(o => {
                const sel = occasion === o;
                return (
                  <button key={o} onClick={() => setOccasion(sel?null:o)}
                    style={{ border:`1.5px solid ${sel?G.orange:"#E8E0D8"}`, borderRadius:20, padding:"8px 16px", fontSize:13, cursor:"pointer", background:sel?G.pale:"#fff", color:sel?G.mid:"#555", fontWeight:sel?600:400 }}>
                    {sel?"✓ ":""}{o}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:12 }}>When?</div>
            <div style={{ display:"flex", gap:10, marginBottom:24 }}>
              <input type="date" value={date} disabled={notSureDate} onChange={e=>{setDate(e.target.value);setNotSureDate(false);}}
                style={{ flex:1, border:`1.5px solid ${!notSureDate&&date?G.orange:"#E8E0D8"}`, borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", opacity:notSureDate?0.4:1 }} />
              <button onClick={() => {setNotSureDate(!notSureDate);setDate("");}}
                style={{ border:`1.5px solid ${notSureDate?G.orange:"#E8E0D8"}`, borderRadius:10, padding:"12px 16px", fontSize:13, fontWeight:600, cursor:"pointer", background:notSureDate?G.pale:"#fff", color:notSureDate?G.mid:"#555", whiteSpace:"nowrap" }}>
                {notSureDate?"✓ Not sure yet":"Not sure yet"}
              </button>
            </div>

            <div style={{ fontSize:14, fontWeight:700, color:G.darkText, marginBottom:6 }}>
              Anything about {petName} we should know? <span style={{ fontSize:13, color:"#BBB", fontWeight:400 }}>Optional</span>
            </div>
            <textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)}
              placeholder={`Energy level, health conditions, favourite activities, location…`}
              style={{ width:"100%", border:"1.5px solid #E8E0D8", borderRadius:10, padding:"12px 14px", fontSize:14, color:G.darkText, outline:"none", resize:"none", fontFamily:"inherit", lineHeight:1.6, marginBottom:24, boxSizing:"border-box" }} />

            <button onClick={canSend&&!sending?handleSend:undefined}
              style={{ width:"100%", background:canSend?`linear-gradient(135deg,${G.orange},${G.mid})`:"#E8E0D8", color:canSend?"#fff":"#999", border:"none", borderRadius:40, padding:"15px", fontSize:16, fontWeight:800, cursor:canSend&&!sending?"pointer":"not-allowed", marginBottom:10, opacity:sending?0.7:1 }}>
              {sending?"Sending…":"Send to my Play Concierge →"}
            </button>
            <div style={{ fontSize:12, color:"#888", textAlign:"center" }}>
              We already have your contact details. Your Concierge will reach out — you don't need to chase.
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
