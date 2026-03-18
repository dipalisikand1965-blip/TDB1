/**
 * PlayConciergeSection.jsx — /play pillar
 * "Play, Personally" — mirrors GoConciergeSection.jsx
 * GET /api/service-box/services?pillar=play
 */
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../utils/api";
import PlayConciergeModal from "./PlayConciergeModal";

const G = { deep:"#7B2D00", mid:"#7B3F00", green:"#E76F51", light:"#FFAD9B", pale:"#FFF0EA", darkText:"#7B2D00", mutedText:"#8B4513" };

export default function PlayConciergeSection({ pet }) {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modalSvc, setModalSvc] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    fetch(`${API_URL}/api/service-box/services?pillar=play`, {
      headers: token ? { Authorization:`Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.services?.length) setServices(data.services.slice(0,8)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading || !services.length) return null;

  return (
    <>
      {modalSvc && <PlayConciergeModal pet={pet} service={modalSvc} token={token} onClose={() => setModalSvc(null)} />}
      <div style={{ marginBottom:32 }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <h2 style={{ fontSize:"clamp(1.5rem,4vw,2rem)", fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:6 }}>
            Play, Personally
          </h2>
          <p style={{ fontSize:14, color:G.mutedText, maxWidth:540, margin:"0 auto", lineHeight:1.6 }}>
            Tell us what {pet?.name||"your dog"} loves. We'll plan the outings, book the walks, and build the fitness routine.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(240px,100%),1fr))", gap:16 }}>
          {services.map((svc,i) => (
            <div key={svc.id||i}
              style={{ background:"#fff", borderRadius:16, overflow:"hidden", border:`1px solid rgba(231,111,81,0.15)`, cursor:"pointer", transition:"transform 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="none"}
              onClick={() => setModalSvc(svc)}>
              {(svc.cloudinary_image_url||svc.watercolor_image||svc.image_url)
                ? <img src={svc.cloudinary_image_url||svc.watercolor_image||svc.image_url} alt={svc.name} style={{ width:"100%", height:180, objectFit:"cover" }} onError={e=>{e.target.style.display="none";}} />
                : <div style={{ height:180, background:`linear-gradient(135deg,${G.pale},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:48 }}>🌳</div>}
              <div style={{ padding:"14px 16px 18px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:6 }}>{svc.name}</div>
                {svc.description && <div style={{ fontSize:13, color:G.mutedText, lineHeight:1.5, marginBottom:12, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{svc.description}</div>}
                <button style={{ fontSize:13, fontWeight:700, color:G.mid, background:"none", border:"none", padding:0, cursor:"pointer" }}>
                  Book this service →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
