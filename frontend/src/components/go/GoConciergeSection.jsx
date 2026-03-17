/**
 * GoConciergeSection.jsx — /go pillar live services section
 * "Go, Personally" — mirrors CareConciergeSection.jsx exactly
 *
 * Fetches live go services from DB
 * Props: pet — pet object
 *
 * WIRING: GET /api/service-box/services?pillar=go
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../utils/api";
import GoConciergeModal from "./GoConciergeModal";

const G = { deep:"#0D3349", deepMid:"#1A5276", teal:"#1ABC9C", light:"#76D7C4", pale:"#D1F2EB", gold:"#C9973A", mutedText:"#5D6D7E", darkText:"#0D3349" };

export default function GoConciergeSection({ pet }) {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modalSvc, setModalSvc] = useState(null);
  const { token } = useAuth();
  const petName = pet?.name || "your dog";

  useEffect(() => {
    fetch(`${API_URL}/api/service-box/services?pillar=go`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.services?.length) setServices(data.services.slice(0, 8)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading || !services.length) return null;

  return (
    <>
      {modalSvc && <GoConciergeModal pet={pet} service={modalSvc} token={token} onClose={() => setModalSvc(null)} />}

      <div style={{ marginBottom:32 }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <h2 style={{ fontSize:"clamp(1.5rem,4vw,2rem)", fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:6 }}>
            Go, Personally
          </h2>
          <p style={{ fontSize:14, color:G.mutedText, maxWidth:540, margin:"0 auto", lineHeight:1.6 }}>
            Tell us what you want {petName}'s trip to feel like. We'll handle the rest.
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(240px,100%),1fr))", gap:16 }}>
          {services.map((svc, i) => (
            <div key={svc.id || i}
              style={{ background:"#fff", borderRadius:16, overflow:"hidden", border:`1px solid rgba(26,188,156,0.12)`, cursor:"pointer", transition:"transform 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.transform="translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform="none"}
              onClick={() => setModalSvc(svc)}>
              {(svc.cloudinary_image_url || svc.watercolor_image || svc.image_url) ? (
                <img src={svc.cloudinary_image_url || svc.watercolor_image || svc.image_url} alt={svc.name} style={{ width:"100%", height:180, objectFit:"cover" }} onError={e => { e.target.style.display="none"; }} />
              ) : (
                <div style={{ height:180, background:`linear-gradient(135deg,${G.pale},${G.light})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:48 }}>✈️</div>
              )}
              <div style={{ padding:"14px 16px 18px" }}>
                <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:6, lineHeight:1.3 }}>{svc.name}</div>
                {svc.description && <div style={{ fontSize:13, color:G.mutedText, lineHeight:1.5, marginBottom:12, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{svc.description}</div>}
                <button style={{ fontSize:13, fontWeight:700, color:G.teal, background:"none", border:"none", padding:0, cursor:"pointer" }}
                  onClick={() => setModalSvc(svc)}>
                  Book {petName}'s {svc.name} →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
