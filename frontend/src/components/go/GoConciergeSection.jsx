/**
 * GoConciergeSection.jsx — /go pillar live services section
 * "Go, Personally" — mirrors CareConciergeSection.jsx exactly
 * Split into 2 sections: Travel Services + Stay & Board Services
 * WIRING: GET /api/service-box/services?pillar=go
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../utils/api";
import GoConciergeModal from "./GoConciergeModal";

const G = { deep:"#0D3349", deepMid:"#1A5276", teal:"#1ABC9C", light:"#76D7C4", pale:"#D1F2EB", gold:"#C9973A", mutedText:"#5D6D7E", darkText:"#0D3349", border:"rgba(26,188,156,0.18)" };

function ServiceCard({ svc, petName, onClick }) {
  const [hovered, setHovered] = useState(false);
  const accentColor = svc.accent_colour || G.deepMid;
  return (
    <div
      style={{ background:"#fff", borderRadius:16, overflow:"hidden", border:`1px solid ${G.border}`, cursor:"pointer", transition:"transform 0.15s, box-shadow 0.15s", transform:hovered?"translateY(-4px)":"none", boxShadow:hovered?"0 12px 32px rgba(13,51,73,0.12)":"0 2px 8px rgba(13,51,73,0.06)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      data-testid={`go-service-card-${svc.id}`}>
      {/* Illustration area */}
      {(svc.cloudinary_image_url || svc.watercolor_image || svc.image_url) ? (
        <img src={svc.cloudinary_image_url || svc.watercolor_image || svc.image_url} alt={svc.name} style={{ width:"100%", height:160, objectFit:"cover" }} onError={e => { e.target.style.display="none"; }} />
      ) : (
        <div style={{ height:160, background:`linear-gradient(135deg,${accentColor}22,${accentColor}44)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:52 }}>
          {svc.icon || "✈️"}
        </div>
      )}
      <div style={{ padding:"14px 16px 18px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
          <span style={{ fontSize:10, fontWeight:700, background:`${accentColor}18`, color:accentColor, borderRadius:20, padding:"2px 8px", textTransform:"uppercase" }}>
            {svc.category === "stay" ? "Stay & Board" : "Travel"}
          </span>
          {svc.urgent && <span style={{ fontSize:10, fontWeight:700, background:"#FFEBEE", color:"#C62828", borderRadius:20, padding:"2px 8px" }}>Urgent</span>}
        </div>
        <div style={{ fontSize:15, fontWeight:700, color:G.darkText, marginBottom:5, lineHeight:1.3 }}>{svc.name}</div>
        {svc.tagline && <div style={{ fontSize:12, color:G.mutedText, lineHeight:1.5, marginBottom:12, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{svc.tagline}</div>}
        <button
          style={{ fontSize:13, fontWeight:700, color:accentColor, background:"none", border:"none", padding:0, cursor:"pointer" }}
          onClick={onClick}>
          Book {petName}'s {svc.name} →
        </button>
      </div>
    </div>
  );
}

export default function GoConciergeSection({ pet }) {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modalSvc, setModalSvc] = useState(null);
  const { token } = useAuth();
  const petName = pet?.name || "your dog";

  useEffect(() => {
    fetch(`${API_URL}/api/service-box/services?pillar=go&limit=20`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.services?.length) setServices(data.services); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ textAlign:"center", padding:"40px 0", color:"#888" }}>
      <div style={{ width:20, height:20, border:`2px solid ${G.pale}`, borderTopColor:G.teal, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 10px" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading Go services…
    </div>
  );

  if (!services.length) return null;

  const travelServices = services.filter(s => s.category === "travel" || s.sub_pillar === "travel");
  const stayServices = services.filter(s => s.category === "stay" || s.sub_pillar === "stay");

  const SectionBlock = ({ title, subtitle, icon, services: svcs, accentGradient }) => (
    <div style={{ marginBottom:40 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:20, paddingBottom:16, borderBottom:`2px solid ${G.pale}` }}>
        <div style={{ width:44, height:44, borderRadius:12, background:accentGradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{icon}</div>
        <div>
          <h3 style={{ fontSize:"clamp(1.1rem,2.5vw,1.375rem)", fontWeight:800, color:G.darkText, margin:0, fontFamily:"Georgia,serif" }}>{title}</h3>
          <p style={{ fontSize:13, color:G.mutedText, margin:"4px 0 0", lineHeight:1.5 }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(min(240px,100%),1fr))", gap:16 }}>
        {svcs.map((svc, i) => (
          <ServiceCard key={svc.id || i} svc={svc} petName={petName} onClick={() => setModalSvc(svc)} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      {modalSvc && <GoConciergeModal pet={pet} service={modalSvc} token={token} onClose={() => setModalSvc(null)} />}

      <div style={{ marginBottom:32 }}>
        {/* Section heading */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <h2 style={{ fontSize:"clamp(1.5rem,4vw,2rem)", fontWeight:800, color:G.darkText, fontFamily:"Georgia,serif", marginBottom:6 }}>
            Go, Personally
          </h2>
          <p style={{ fontSize:14, color:G.mutedText, maxWidth:540, margin:"0 auto", lineHeight:1.6 }}>
            Tell us what you want {petName}'s journey to feel like. We'll handle everything else.
          </p>
        </div>

        {travelServices.length > 0 && (
          <SectionBlock
            title="Go, Personally — Travel"
            subtitle={`Flight, road trips, pet taxi, relocation, and complete trip planning for ${petName}.`}
            icon="✈️"
            services={travelServices}
            accentGradient={`linear-gradient(135deg,#E3F2FD,#BBDEFB)`}
          />
        )}

        {stayServices.length > 0 && (
          <SectionBlock
            title="Go, Personally — Stay & Board"
            subtitle={`Boarding, daycare, and pet sitting arranged around ${petName}'s personality.`}
            icon="🏡"
            services={stayServices}
            accentGradient={`linear-gradient(135deg,${G.pale},${G.light})`}
          />
        )}

        {/* Bottom CTA */}
        <div style={{ textAlign:"center", marginTop:16 }}>
          <button
            style={{ background:`linear-gradient(135deg,${G.teal},${G.deepMid})`, color:"#fff", border:"none", borderRadius:12, padding:"13px 28px", fontSize:14, fontWeight:700, cursor:"pointer" }}
            data-testid="go-personally-cta"
            onClick={() => setModalSvc(services[0])}>
            Talk to your Go Concierge →
          </button>
          <p style={{ fontSize:12, color:"#888", marginTop:8 }}>48h response promise · Emergency: within 5 minutes</p>
        </div>
      </div>
    </>
  );
}
